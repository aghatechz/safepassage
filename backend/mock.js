// File-based Persistent Mock Data Store for SafePassage
// Used when PostgreSQL is unavailable
// Data is persisted to mock_data.json so it survives server restarts

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'mock_data.json');

let nextUserId = 6;
let nextAgencyId = 7;
let nextReportId = 6;
let nextVoteId = 7;

function saveToDisk() {
  try {
    const data = JSON.stringify({
      users, agencies, reports, votes,
      nextUserId, nextAgencyId, nextReportId, nextVoteId
    }, null, 2);
    fs.writeFileSync(DATA_FILE, data, 'utf8');
  } catch (err) {
    console.error('⚠️ Failed to persist mock data:', err.message);
  }
}

function loadFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (data.users) { users.length = 0; users.push(...data.users); }
      if (data.agencies) { agencies.length = 0; agencies.push(...data.agencies); }
      if (data.reports) { reports.length = 0; reports.push(...data.reports); }
      if (data.votes) { votes.length = 0; votes.push(...data.votes); }
      if (data.nextUserId) nextUserId = data.nextUserId;
      if (data.nextAgencyId) nextAgencyId = data.nextAgencyId;
      if (data.nextReportId) nextReportId = data.nextReportId;
      if (data.nextVoteId) nextVoteId = data.nextVoteId;
      console.log('📂 Loaded persisted mock data from disk.');
    }
  } catch (err) {
    console.error('⚠️ Failed to load persisted mock data:', err.message);
  }
}

// Initial seed data
const users = [
  { id: 1, name: 'System Admin', email: 'admin@safepassage.com', password_hash: '$2a$10$a/jJChzlFQxuhvLa8wVfY.D/rMaxEpv9PPy.DDfonWjwK7oFrX.jm', role: 'admin', created_at: new Date().toISOString() },
  { id: 2, name: 'Ali Khan', email: 'ali@example.com', password_hash: '$2a$10$a/jJChzlFQxuhvLa8wVfY.D/rMaxEpv9PPy.DDfonWjwK7oFrX.jm', role: 'user', created_at: new Date().toISOString() },
  { id: 3, name: 'Priya Sharma', email: 'priya@example.com', password_hash: '$2a$10$a/jJChzlFQxuhvLa8wVfY.D/rMaxEpv9PPy.DDfonWjwK7oFrX.jm', role: 'user', created_at: new Date().toISOString() },
  { id: 4, name: 'Rahim Rahman', email: 'rahim@example.com', password_hash: '$2a$10$a/jJChzlFQxuhvLa8wVfY.D/rMaxEpv9PPy.DDfonWjwK7oFrX.jm', role: 'user', created_at: new Date().toISOString() },
  { id: 5, name: 'Maria Santos', email: 'maria@example.com', password_hash: '$2a$10$a/jJChzlFQxuhvLa8wVfY.D/rMaxEpv9PPy.DDfonWjwK7oFrX.jm', role: 'user', created_at: new Date().toISOString() },
];

const agencies = [
  { id: 1, name: 'Gulf Horizon Overseas', location: 'Mumbai, India', latitude: 19.076, longitude: 72.8777, trust_score: 85, is_verified: true, created_at: new Date().toISOString() },
  { id: 2, name: 'Apex Global Recruitment', location: 'Islamabad, Pakistan', latitude: 33.6844, longitude: 73.0479, trust_score: 30, is_verified: false, created_at: new Date().toISOString() },
  { id: 3, name: 'Manila Direct Placements', location: 'Manila, Philippines', latitude: 14.5995, longitude: 120.9842, trust_score: 95, is_verified: true, created_at: new Date().toISOString() },
  { id: 4, name: 'Bengal Allied Agency', location: 'Dhaka, Bangladesh', latitude: 23.8103, longitude: 90.4125, trust_score: 45, is_verified: false, created_at: new Date().toISOString() },
  { id: 5, name: 'EuroWork Express Inc.', location: 'Punjab, Pakistan', latitude: 31.5204, longitude: 74.3587, trust_score: 15, is_verified: false, created_at: new Date().toISOString() },
  { id: 6, name: 'Pacific Maritime Services', location: 'Cebu, Philippines', latitude: 10.3157, longitude: 123.8854, trust_score: 100, is_verified: false, created_at: new Date().toISOString() },
];

const reports = [
  { id: 1, agency_id: 2, user_id: 2, description: 'They asked me to deposit 50,000 PKR as a visa processing fee before they would send the contract. After I paid, they blocked my phone number.', evidence_url: null, red_flags: ['pay before visa', 'deposit required'], created_at: new Date().toISOString() },
  { id: 2, agency_id: 2, user_id: 3, description: 'Offered a guaranteed work visa to Dubai but refused to provide any written contract. Said contract would be signed in Dubai.', evidence_url: null, red_flags: ['no written contract', 'guaranteed visa'], created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, agency_id: 4, user_id: 4, description: 'Charged 10,000 BDT for a mandatory medical checkup and training course at their own facility, but never provided the job offer details.', evidence_url: null, red_flags: ['training fee', 'deposit required'], created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 4, agency_id: 5, user_id: 2, description: 'They said I will enter Europe on a tourist visa first and then convert it to a work visa, which is illegal. They also asked to keep my original passport.', evidence_url: null, red_flags: ['tourist visa for work', 'keep original passport'], created_at: new Date(Date.now() - 259200000).toISOString() },
  { id: 5, agency_id: 1, user_id: 3, description: 'Very professional service. They charged a standard service fee only after my work visa was processed and verified. Highly recommend.', evidence_url: null, red_flags: [], created_at: new Date(Date.now() - 345600000).toISOString() },
];

const votes = [
  { id: 1, report_id: 1, user_id: 3, vote_type: 'upvote', created_at: new Date().toISOString() },
  { id: 2, report_id: 1, user_id: 4, vote_type: 'upvote', created_at: new Date().toISOString() },
  { id: 3, report_id: 2, user_id: 2, vote_type: 'upvote', created_at: new Date().toISOString() },
  { id: 4, report_id: 3, user_id: 2, vote_type: 'upvote', created_at: new Date().toISOString() },
  { id: 5, report_id: 4, user_id: 4, vote_type: 'upvote', created_at: new Date().toISOString() },
  { id: 6, report_id: 5, user_id: 4, vote_type: 'downvote', created_at: new Date().toISOString() },
];

// If there's saved data from a previous session, load it (overwrites seed defaults)
loadFromDisk();

function findUserByEmail(email) {
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

function findUserById(id) {
  return users.find(u => u.id === id);
}

function addUser(name, email, password_hash) {
  const user = { id: nextUserId++, name, email: email.toLowerCase(), password_hash, role: 'user', created_at: new Date().toISOString() };
  users.push(user);
  saveToDisk();
  return user;
}

function getAgencies(search) {
  let result = agencies.map(a => {
    const reportCount = reports.filter(r => r.agency_id === a.id).length;
    return { ...a, report_count: reportCount };
  });
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(a => a.name.toLowerCase().includes(s) || a.location.toLowerCase().includes(s));
  }
  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

function getAgencyById(id, userId) {
  const agency = agencies.find(a => a.id === id);
  if (!agency) return null;
  const agencyReports = reports.filter(r => r.agency_id === id).map(r => {
    const reporter = findUserById(r.user_id);
    const reportVotes = votes.filter(v => v.report_id === r.id);
    const upvotes = reportVotes.filter(v => v.vote_type === 'upvote').length;
    const downvotes = reportVotes.filter(v => v.vote_type === 'downvote').length;
    const userVote = userId ? (reportVotes.find(v => v.user_id === userId)?.vote_type || null) : null;
    return { ...r, reporter_name: reporter?.name || 'Anonymous', upvotes, downvotes, user_vote: userVote };
  });
  const reportCount = agencyReports.length;
  return { agency: { ...agency, report_count: reportCount }, reports: agencyReports };
}

function addAgency(name, location, latitude, longitude) {
  const agency = { id: nextAgencyId++, name, location, latitude, longitude, trust_score: 100, is_verified: false, created_at: new Date().toISOString() };
  agencies.push(agency);
  saveToDisk();
  return agency;
}

function updateAgencyVerify(id, isVerified) {
  const agency = agencies.find(a => a.id === id);
  if (!agency) return null;
  agency.is_verified = isVerified;
  if (isVerified) agency.trust_score = Math.max(90, agency.trust_score);
  saveToDisk();
  return agency;
}

function getRecentReports() {
  const sorted = [...reports].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
  return sorted.map(r => {
    const agency = agencies.find(a => a.id === r.agency_id);
    const reporter = findUserById(r.user_id);
    return {
      id: r.id, description: r.description, evidence_url: r.evidence_url, red_flags: r.red_flags,
      created_at: r.created_at, agency_name: agency?.name || 'Unknown', agency_id: r.agency_id,
      agency_location: agency?.location || '', agency_trust_score: agency?.trust_score || 0,
      agency_is_verified: agency?.is_verified || false, reporter_name: reporter?.name || 'Anonymous'
    };
  });
}

function getStats() {
  const locations = {};
  agencies.forEach(a => {
    const loc = a.location;
    if (!locations[loc]) {
      const locReports = reports.filter(r => r.agency_id === a.id);
      locations[loc] = {
        location: loc, report_count: locReports.length, latitude: a.latitude, longitude: a.longitude,
        trust_scores: [a.trust_score], agencies: [{ id: a.id, name: a.name, trust_score: a.trust_score, is_verified: a.is_verified, report_count: locReports.length }]
      };
    } else {
      const locReports = reports.filter(r => r.agency_id === a.id);
      locations[loc].report_count += locReports.length;
      locations[loc].trust_scores.push(a.trust_score);
      locations[loc].agencies.push({ id: a.id, name: a.name, trust_score: a.trust_score, is_verified: a.is_verified, report_count: locReports.length });
    }
  });
  return Object.values(locations).map(l => ({
    ...l, average_trust_score: l.trust_scores.reduce((a, b) => a + b, 0) / l.trust_scores.length
  })).sort((a, b) => b.report_count - a.report_count);
}

function addReport(agency_id, user_id, description, evidence_url, red_flags) {
  const report = { id: nextReportId++, agency_id, user_id, description, evidence_url, red_flags, created_at: new Date().toISOString() };
  reports.push(report);
  recalculateScore(agency_id);
  saveToDisk();
  return report;
}

function handleVote(report_id, user_id, vote_type) {
  const existing = votes.find(v => v.report_id === report_id && v.user_id === user_id);
  let finalType = null;
  let msg = '';
  if (existing) {
    if (existing.vote_type === vote_type) {
      votes.splice(votes.indexOf(existing), 1);
      finalType = null;
      msg = 'Vote retracted successfully.';
    } else {
      existing.vote_type = vote_type;
      finalType = vote_type;
      msg = `Vote changed to ${vote_type}.`;
    }
  } else {
    votes.push({ id: nextVoteId++, report_id, user_id, vote_type, created_at: new Date().toISOString() });
    finalType = vote_type;
    msg = `Vote ${vote_type} cast successfully.`;
  }
  const reportVotes = votes.filter(v => v.report_id === report_id);
  const upvotes = reportVotes.filter(v => v.vote_type === 'upvote').length;
  const downvotes = reportVotes.filter(v => v.vote_type === 'downvote').length;
  const report = reports.find(r => r.id === report_id);
  if (report) recalculateScore(report.agency_id);
  saveToDisk();
  return { message: msg, vote_type: finalType, upvotes, downvotes };
}

function recalculateScore(agency_id) {
  const agency = agencies.find(a => a.id === agency_id);
  if (!agency) return;
  const agencyReports = reports.filter(r => r.agency_id === agency_id);
  const reportCount = agencyReports.length;
  const uniqueFlags = new Set();
  agencyReports.forEach(r => { if (Array.isArray(r.red_flags)) r.red_flags.forEach(f => uniqueFlags.add(f)); });
  const flagCount = uniqueFlags.size;
  const agencyVotes = votes.filter(v => agencyReports.some(r => r.id === v.report_id));
  const upvotes = agencyVotes.filter(v => v.vote_type === 'upvote').length;
  const downvotes = agencyVotes.filter(v => v.vote_type === 'downvote').length;
  const netUp = Math.max(0, upvotes - downvotes);
  let score = 100 - (reportCount * 10) - (flagCount * 15) - (netUp * 5);
  score = Math.max(0, Math.min(100, score));
  if (agency.is_verified) score = Math.max(85, score);
  agency.trust_score = score;
}

module.exports = {
  findUserByEmail, findUserById, addUser,
  getAgencies, getAgencyById, addAgency, updateAgencyVerify,
  getRecentReports, getStats, addReport, handleVote,
  users
};
