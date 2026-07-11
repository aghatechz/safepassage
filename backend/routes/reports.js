const express = require('express');
const router = express.Router();
const { pool, isDbConnected } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { upload, getEvidenceUrl } = require('../config/s3');
const { detectRedFlags } = require('../utils/detector');
const { recalculateAgencyTrustScore } = require('../utils/score');

// POST /api/reports
router.post('/', authenticateToken, upload.single('evidence'), async (req, res) => {
  const { agency_id, description } = req.body;
  if (!agency_id || !description) return res.status(400).json({ message: 'Agency ID and description required.' });
  const agencyIdInt = parseInt(agency_id, 10);
  try {
    const redFlags = detectRedFlags(description);
    const evidenceUrl = req.file ? getEvidenceUrl(req, req.file) : null;
    if (!isDbConnected()) { const m = require('../mock'); return res.status(201).json({ message: 'Scam report submitted.', report: m.addReport(agencyIdInt, req.user.id, description.trim(), evidenceUrl, redFlags), detected_red_flags: redFlags }); }
    const agencyCheck = await pool.query('SELECT * FROM agencies WHERE id = $1', [agencyIdInt]);
    if (agencyCheck.rows.length === 0) return res.status(404).json({ message: 'Agency not found.' });
    const newReport = await pool.query(`INSERT INTO reports (agency_id,user_id,description,evidence_url,red_flags) VALUES ($1,$2,$3,$4,$5) RETURNING *`,[agencyIdInt, req.user.id, description.trim(), evidenceUrl, redFlags]);
    await recalculateAgencyTrustScore(agencyIdInt);
    res.status(201).json({ message: 'Scam report submitted.', report: newReport.rows[0], detected_red_flags: redFlags });
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/reports/recent
router.get('/recent', async (req, res) => {
  try {
    if (!isDbConnected()) { const m = require('../mock'); return res.json(m.getRecentReports()); }
    const result = await pool.query(`SELECT r.id, r.description, r.evidence_url, r.red_flags, r.created_at, a.name as agency_name, a.id as agency_id, a.location as agency_location, a.trust_score as agency_trust_score, a.is_verified as agency_is_verified, u.name as reporter_name FROM reports r JOIN agencies a ON r.agency_id = a.id LEFT JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC LIMIT 10`);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch recent reports error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/reports/stats
router.get('/stats', async (req, res) => {
  try {
    if (!isDbConnected()) { const m = require('../mock'); return res.json(m.getStats()); }
    const result = await pool.query(`SELECT a.location, COUNT(r.id)::int as report_count, AVG(a.latitude)::numeric(10,8) as latitude, AVG(a.longitude)::numeric(11,8) as longitude, AVG(a.trust_score)::numeric(5,2)::float as average_trust_score, json_agg(json_build_object('id',a.id,'name',a.name,'trust_score',a.trust_score,'is_verified',a.is_verified,'report_count',(SELECT COUNT(*)::int FROM reports WHERE agency_id=a.id))) as agencies FROM agencies a LEFT JOIN reports r ON a.id=r.agency_id GROUP BY a.location ORDER BY report_count DESC`);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch map stats error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
