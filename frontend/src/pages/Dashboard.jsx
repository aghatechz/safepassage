import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, AlertTriangle, CheckCircle2, ChevronRight, FileText, Globe, Building2, Shield, Flag, MapPin } from 'lucide-react';
import { apiFetch } from '../utils/api';
import RedFlagBadge from '../components/RedFlagBadge';

export default function Dashboard({ setServedBy }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [agencies, setAgencies] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    verifiedCount: 0,
    agenciesCount: 0,
    flaggedCount: 0,
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const agenciesList = await apiFetch('/agencies', {}, setServedBy);
        setAgencies(agenciesList);
        const reportsList = await apiFetch('/reports/recent', {}, setServedBy);
        setRecentReports(reportsList);
        const verified = agenciesList.filter(a => a.is_verified).length;
        const totalReps = agenciesList.reduce((acc, a) => acc + (a.report_count || 0), 0);
        const flagged = agenciesList.filter(a => a.trust_score < 50).length;
        setStats({ totalReports: totalReps, verifiedCount: verified, agenciesCount: agenciesList.length, flaggedCount: flagged });
      } catch (err) {
        console.error('Error loading dashboard data:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [setServedBy]);

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    try {
      const results = await apiFetch(`/agencies?search=${encodeURIComponent(value)}`, {}, setServedBy);
      setAgencies(results);
    } catch (err) {
      console.error('Search error:', err.message);
    }
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'badge-teal';
    if (score >= 50) return 'badge-amber';
    return 'badge-red';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Welcome Banner */}
      <div className="gradient-teal-subtle rounded-2xl border border-teal-100 p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge-teal text-[10px]">
            <Shield className="h-3 w-3" /> Crowd-Sourced Verification Platformm
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Agency Search & Verification Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Search agencies, check trust scores, and report suspicious activity.
        </p>
        <div className="mt-4 max-w-xl">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Search className="h-4.5 w-4.5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search agency by name or location..."
              className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agencies</span>
            <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.agenciesCount}</div>
          <div className="text-xs text-slate-400 mt-1">Registered agencies</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scam Reports</span>
            <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Flag className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalReports}</div>
          <div className="text-xs text-slate-400 mt-1">Total alerts filed</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.verifiedCount}</div>
          <div className="text-xs text-slate-400 mt-1">Legitimate agencies</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Flagged</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.flaggedCount}</div>
          <div className="text-xs text-slate-400 mt-1">High-risk agencies</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Agency Directory */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Globe className="h-5 w-5 text-teal-600" />
              Agency Directory
              <span className="text-sm font-medium text-slate-400">({agencies.length})</span>
            </h2>
            <Link to="/report"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition-all"
            >+ Report Scam</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100"></div>)}</div>
          ) : agencies.length === 0 ? (
            <div className="card p-10 text-center">
              <Building2 className="mx-auto h-10 w-10 text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">No agencies found</p>
              <p className="text-xs text-slate-400 mt-1">Try a different search or report a scam to add a new agency.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {agencies.map((agency) => (
                <Link key={agency.id} to={`/agency/${agency.id}`}
                  className="card flex items-center justify-between p-4 hover:border-teal-200 hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                      agency.is_verified ? 'bg-emerald-50 text-emerald-600' : agency.trust_score < 50 ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-600'
                    }`}>
                      {agency.is_verified ? <CheckCircle2 className="h-5 w-5" /> : agency.trust_score < 50 ? <AlertTriangle className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm truncate">{agency.name}</span>
                        {agency.is_verified && <span className="badge-teal text-[10px] py-0.5 shrink-0"><CheckCircle2 className="h-3 w-3" /> Trusted</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> {agency.location}</span>
                        <span className="text-xs text-slate-400">{agency.report_count || 0} reports</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${getScoreBadge(agency.trust_score)}`}>{agency.trust_score}%</span>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><FileText className="h-5 w-5 text-amber-500" /> Recent Alerts</h2>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-32 animate-pulse rounded-lg bg-slate-100"></div>)}</div>
          ) : recentReports.length === 0 ? (
            <div className="card p-8 text-center"><Shield className="mx-auto h-8 w-8 text-slate-300 mb-2" /><p className="text-sm text-slate-500">No scam reports filed yet.</p></div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="card p-4 border-l-4 border-l-amber-400 space-y-2.5">
                  <div>
                    <Link to={`/agency/${report.agency_id}`} className="font-semibold text-slate-900 hover:text-teal-600 transition-colors text-sm block">{report.agency_name}</Link>
                    <span className="text-[11px] text-slate-400 font-medium">{report.agency_location}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">"{report.description}"</p>
                  <RedFlagBadge flags={report.red_flags} />
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1.5 border-t border-slate-100">
                    <span>By: {report.reporter_name || 'Anonymous'}</span>
                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
