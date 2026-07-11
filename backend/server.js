const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const agencyRoutes = require('./routes/agencies');
const reportRoutes = require('./routes/reports');
const voteRoutes = require('./routes/votes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse incoming JSON payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load Balancer Middleware - inject server hostname/instance ID into response headers
app.use((req, res, next) => {
  res.setHeader('X-Served-By', os.hostname());
  next();
});

// Serve static evidence uploads locally
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes mapping
app.use('/api/auth', authRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/votes', voteRoutes);

// Metadata route for demonstrating load balancing
app.get('/api/hostname', (req, res) => {
  res.json({ 
    hostname: os.hostname(),
    platform: os.platform(),
    uptime: os.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Root check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the SafePassage API Services.',
    status: 'Operational',
    served_by: os.hostname()
  });
});

// Wait for the database connection check to complete before accepting requests.
// This prevents a race condition where signup/login requests arrive before the
// async DB connection test finishes, causing silent fallback to mock data.
const { ready } = require('./config/db');
ready.then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 SafePassage API Server started on port ${PORT}`);
    console.log(`📡 Serving request from instance: ${os.hostname()}`);
  });
});
