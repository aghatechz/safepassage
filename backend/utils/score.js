const { pool } = require('../config/db');

/**
 * Recalculates and updates the trust score of a recruitment agency.
 * Formula:
 * - Base score: 100
 * - Minus 10 points per report (scam alert)
 * - Minus 15 points per unique red flag detected across reports
 * - Minus 5 points per net report upvote (community confirmation of scam)
 * - If verified (marked as legitimate by admin), trust score is boosted or floored at 90.
 * - Min score: 0, Max score: 100
 * 
 * @param {number} agencyId - The ID of the agency to update.
 * @param {object} [client] - Optional database client for transaction safety.
 */
const recalculateAgencyTrustScore = async (agencyId, client = pool) => {
  try {
    // 1. Get reports and check if agency is verified
    const agencyResult = await client.query(
      'SELECT is_verified FROM agencies WHERE id = $1',
      [agencyId]
    );

    if (agencyResult.rows.length === 0) return;
    const isVerified = agencyResult.rows[0].is_verified;

    // 2. Count reports
    const reportsResult = await client.query(
      'SELECT id, red_flags FROM reports WHERE agency_id = $1',
      [agencyId]
    );
    const reportsCount = reportsResult.rows.length;

    // 3. Count unique red flags
    const uniqueRedFlags = new Set();
    reportsResult.rows.forEach(r => {
      if (Array.isArray(r.red_flags)) {
        r.red_flags.forEach(flag => uniqueRedFlags.add(flag));
      }
    });
    const redFlagsCount = uniqueRedFlags.size;

    // 4. Count net votes on reports of this agency
    const votesResult = await client.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN v.vote_type = 'upvote' THEN 1 ELSE 0 END), 0)::int as upvotes,
        COALESCE(SUM(CASE WHEN v.vote_type = 'downvote' THEN 1 ELSE 0 END), 0)::int as downvotes
       FROM reports r
       JOIN votes v ON r.id = v.report_id
       WHERE r.agency_id = $1`,
      [agencyId]
    );
    
    const upvotes = votesResult.rows[0]?.upvotes || 0;
    const downvotes = votesResult.rows[0]?.downvotes || 0;
    const netUpvotes = Math.max(0, upvotes - downvotes);

    // Calculate score
    let score = 100;
    
    // Penalize reports
    score -= (reportsCount * 10);
    
    // Penalize unique red flags
    score -= (redFlagsCount * 15);
    
    // Penalize upvotes (meaning community confirms the scams)
    score -= (netUpvotes * 5);

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // If verified by admin, keep high score floor
    if (isVerified) {
      score = Math.max(85, score);
    }

    // Update database
    await client.query(
      'UPDATE agencies SET trust_score = $1 WHERE id = $2',
      [score, agencyId]
    );

    console.log(`📊 Recalculated trust score for Agency ID ${agencyId}: ${score} (Verified: ${isVerified})`);
  } catch (error) {
    console.error(`Error recalculating trust score for Agency ID ${agencyId}:`, error);
  }
};

module.exports = {
  recalculateAgencyTrustScore
};
