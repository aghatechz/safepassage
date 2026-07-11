const express = require('express');
const router = express.Router();
const { pool, isDbConnected } = require('../config/db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Coordinates presets for key South/Southeast Asian regions if lat/long are omitted
const REGIONAL_COORDINATES = {
  'pakistan': { lat: 30.3753, lng: 69.3451 },
  'punjab, pakistan': { lat: 31.5204, lng: 74.3587 },
  'sindh, pakistan': { lat: 25.8943, lng: 68.5247 },
  'islamabad, pakistan': { lat: 33.6844, lng: 73.0479 },
  'india': { lat: 20.5937, lng: 78.9629 },
  'new delhi, india': { lat: 28.6139, lng: 77.2090 },
  'mumbai, india': { lat: 19.0760, lng: 72.8777 },
  'kerala, india': { lat: 10.8505, lng: 76.2711 },
  'bangladesh': { lat: 23.6850, lng: 90.3563 },
  'dhaka, bangladesh': { lat: 23.8103, lng: 90.4125 },
  'philippines': { lat: 12.8797, lng: 121.7740 },
  'manila, philippines': { lat: 14.5995, lng: 120.9842 },
  'cebu, philippines': { lat: 10.3157, lng: 123.8854 }
};

const resolveCoordinates = (location) => {
  const locLower = location.toLowerCase().trim();
  for (const [key, coords] of Object.entries(REGIONAL_COORDINATES)) {
    if (locLower.includes(key)) {
      // Add slight jitter so multiple agencies in same city don't overlap completely
      const jitterLat = (Math.random() - 0.5) * 0.05;
      const jitterLng = (Math.random() - 0.5) * 0.05;
      return { lat: coords.lat + jitterLat, lng: coords.lng + jitterLng };
    }
  }
  
  // Default to general center (South Asia region)
  return {
    lat: 20.0 + (Math.random() - 0.5) * 10,
    lng: 80.0 + (Math.random() - 0.5) * 10
  };
};

// GET /api/agencies - Search and filter agencies
router.get('/', async (req, res) => {
  const { search } = req.query;
  try {
    if (!isDbConnected()) { const m = require('../mock'); return res.json(m.getAgencies(search)); }
    let query = `SELECT a.*, COUNT(r.id)::int as report_count FROM agencies a LEFT JOIN reports r ON a.id = r.agency_id`;
    const params = [];
    if (search) { query += ` WHERE a.name ILIKE $1 OR a.location ILIKE $1`; params.push(`%${search}%`); }
    query += ` GROUP BY a.id ORDER BY a.name ASC`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch agencies error:', error);
    res.status(500).json({ message: 'Internal server error fetching agencies.' });
  }
});

// GET /api/agencies/:id - Get agency details
router.get('/:id', async (req, res) => {
  const agencyId = parseInt(req.params.id, 10);
  const userId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'], 10) : null;
  try {
    if (!isDbConnected()) { const m = require('../mock'); const r = m.getAgencyById(agencyId, userId); if (!r) return res.status(404).json({ message: 'Agency not found.' }); return res.json(r); }
    const agencyResult = await pool.query(`SELECT a.*, COUNT(r.id)::int as report_count FROM agencies a LEFT JOIN reports r ON a.id = r.agency_id WHERE a.id = $1 GROUP BY a.id`,[agencyId]);
    if (agencyResult.rows.length === 0) return res.status(404).json({ message: 'Agency not found.' });
    const reportsResult = await pool.query(`SELECT r.id, r.description, r.evidence_url, r.red_flags, r.created_at, u.name as reporter_name, COALESCE(SUM(CASE WHEN v.vote_type='upvote' THEN 1 ELSE 0 END),0)::int as upvotes, COALESCE(SUM(CASE WHEN v.vote_type='downvote' THEN 1 ELSE 0 END),0)::int as downvotes, (SELECT v2.vote_type FROM votes v2 WHERE v2.report_id = r.id AND v2.user_id = $2) as user_vote FROM reports r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN votes v ON r.id = v.report_id WHERE r.agency_id = $1 GROUP BY r.id, u.name ORDER BY r.created_at DESC`,[agencyId, userId || null]);
    res.json({ agency: agencyResult.rows[0], reports: reportsResult.rows });
  } catch (error) {
    console.error('Fetch agency detail error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/agencies
router.post('/', authenticateToken, async (req, res) => {
  const { name, location, latitude, longitude } = req.body;
  if (!name || !location) return res.status(400).json({ message: 'Agency name and location are required.' });
  try {
    if (!isDbConnected()) { const m = require('../mock'); let lat = latitude, lng = longitude; if (lat === undefined || lng === undefined) { const c = resolveCoordinates(location); lat = c.lat; lng = c.lng; } return res.status(201).json(m.addAgency(name.trim(), location.trim(), lat, lng)); }
    const existing = await pool.query('SELECT * FROM agencies WHERE name = $1', [name.trim()]);
    if (existing.rows.length > 0) return res.status(400).json({ message: 'Agency already exists.', agency: existing.rows[0] });
    let lat = latitude, lng = longitude;
    if (lat === undefined || lng === undefined) { const c = resolveCoordinates(location); lat = c.lat; lng = c.lng; }
    const newAgency = await pool.query(`INSERT INTO agencies (name,location,latitude,longitude,trust_score,is_verified) VALUES ($1,$2,$3,$4,100,false) RETURNING *`,[name.trim(), location.trim(), lat, lng]);
    res.status(201).json(newAgency.rows[0]);
  } catch (error) {
    console.error('Create agency error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PATCH /api/agencies/:id/verify
router.patch('/:id/verify', authenticateToken, isAdmin, async (req, res) => {
  const agencyId = parseInt(req.params.id, 10);
  const { is_verified } = req.body;
  if (is_verified === undefined) return res.status(400).json({ message: 'is_verified status is required.' });
  try {
    if (!isDbConnected()) { const m = require('../mock'); const agency = m.updateAgencyVerify(agencyId, is_verified); if (!agency) return res.status(404).json({ message: 'Agency not found.' }); return res.json({ message: `Agency verification status updated to ${is_verified}.`, agency }); }
    const updated = await pool.query(`UPDATE agencies SET is_verified = $1, trust_score = CASE WHEN $1 THEN GREATEST(trust_score, 90) ELSE trust_score END WHERE id = $2 RETURNING *`,[is_verified, agencyId]);
    if (updated.rows.length === 0) return res.status(404).json({ message: 'Agency not found.' });
    res.json({ message: `Agency verification status updated to ${is_verified}.`, agency: updated.rows[0] });
  } catch (error) {
    console.error('Verify agency error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
