const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, isDbConnected } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldevelopment123!';

// Register a new user
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required.' });
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    if (!isDbConnected()) {
      const m = require('../mock');
      if (m.findUserByEmail(email)) return res.status(400).json({ message: 'An account with this email already exists.' });
      const user = m.addUser(name, email, passwordHash);
      const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      return res.status(201).json({ message: 'User registered successfully.', token, user });
    }
    
    const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userExist.rows.length > 0) return res.status(400).json({ message: 'An account with this email already exists.' });
    const newUser = await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at', [name.trim(), email.toLowerCase().trim(), passwordHash, 'user']);
    const user = newUser.rows[0];
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ message: 'User registered successfully.', token, user });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
  try {
    let user;
    if (!isDbConnected()) {
      const m = require('../mock');
      user = m.findUserByEmail(email);
      if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) return res.status(401).json({ message: 'Invalid email or password.' });
    } else {
      const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
      if (userResult.rows.length === 0) return res.status(401).json({ message: 'Invalid email or password.' });
      user = userResult.rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'Login successful.', token, user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// Get current user context
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (!isDbConnected()) { const m = require('../mock'); const user = m.findUserById(req.user.id); if (!user) return res.status(404).json({ message: 'User not found.' }); return res.json({ user }); }
    const userResult = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: userResult.rows[0] });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
