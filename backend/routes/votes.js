const express = require('express');
const router = express.Router();
const { pool, isDbConnected } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { recalculateAgencyTrustScore } = require('../utils/score');

// POST /api/votes
router.post('/', authenticateToken, async (req, res) => {
  const { report_id, vote_type } = req.body;
  if (!report_id || !vote_type) return res.status(400).json({ message: 'Report ID and vote type required.' });
  if (vote_type !== 'upvote' && vote_type !== 'downvote') return res.status(400).json({ message: 'Vote type must be upvote or downvote.' });
  const reportIdInt = parseInt(report_id, 10);
  const userIdInt = req.user.id;
  try {
    if (!isDbConnected()) { const m = require('../mock'); return res.json(m.handleVote(reportIdInt, userIdInt, vote_type)); }
    const reportCheck = await pool.query('SELECT agency_id FROM reports WHERE id = $1', [reportIdInt]);
    if (reportCheck.rows.length === 0) return res.status(404).json({ message: 'Report not found.' });
    const agencyId = reportCheck.rows[0].agency_id;
    const existingVote = await pool.query('SELECT * FROM votes WHERE report_id = $1 AND user_id = $2', [reportIdInt, userIdInt]);
    let finalType = null, msg = '';
    if (existingVote.rows.length > 0) {
      const cur = existingVote.rows[0];
      if (cur.vote_type === vote_type) { await pool.query('DELETE FROM votes WHERE id = $1', [cur.id]); finalType = null; msg = 'Vote retracted.'; }
      else { await pool.query('UPDATE votes SET vote_type = $1 WHERE id = $2', [vote_type, cur.id]); finalType = vote_type; msg = `Vote changed to ${vote_type}.`; }
    } else {
      await pool.query('INSERT INTO votes (report_id, user_id, vote_type) VALUES ($1, $2, $3)', [reportIdInt, userIdInt, vote_type]);
      finalType = vote_type; msg = `Vote ${vote_type} cast.`;
    }
    await recalculateAgencyTrustScore(agencyId);
    const stats = await pool.query(`SELECT COALESCE(SUM(CASE WHEN vote_type='upvote' THEN 1 ELSE 0 END),0)::int as upvotes, COALESCE(SUM(CASE WHEN vote_type='downvote' THEN 1 ELSE 0 END),0)::int as downvotes FROM votes WHERE report_id = $1`, [reportIdInt]);
    res.json({ message: msg, vote_type: finalType, upvotes: stats.rows[0].upvotes, downvotes: stats.rows[0].downvotes });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
