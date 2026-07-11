import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, CheckCircle2, ShieldAlert, AlertTriangle, FileUp, Calendar, User, ArrowLeft, Shield, MapPin } from 'lucide-react';
import { apiFetch } from '../utils/api';
import RedFlagBadge from '../components/RedFlagBadge';

export default function AgencyDetail({ user, setServedBy }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [agency, setAgency] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAgencyData = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/agencies/${id}`, {}, setServedBy);
      setAgency(data.agency);
      setReports(data.reports);
      setError('');
    } catch (err) {
      console.error('Error fetching agency details:', err.message);
      setError('Agency not found or database connection failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgencyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, setServedBy]);

  const handleVote = async (reportId, voteType) => {
    if (!user) {
      alert('You must be logged in to cast votes.');
      navigate('/login');
      return;
    }

    try {
      const response = await apiFetch('/votes', {
        method: 'POST',
        body: JSON.stringify({ report_id: reportId, vote_type: voteType })
      }, setServedBy);

      setReports(prevReports => 
        prevReports.map(rep => {
          if (rep.id === reportId) {
            return {
              ...rep,
              upvotes: response.upvotes,
              downvotes: response.downvotes,
              user_vote: response.vote_type
            };
          }
          return rep;
        })
      );

      const updatedData = await apiFetch(`/agencies/${id}`, {}, setServedBy);
      setAgency(updatedData.agency);

    } catch (err) {
      console.error('Voting error:', err.message);
      alert('Failed to process your vote: ' + err.message);
    }
  };

  const getScoreStyle = (score) => {
    if (score >= 80) return { text: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50', fill: '#059669' };
    if (score >= 50) return { text: 'text-amber-700', border: 'border-amber-200', bg: 'bg-amber-50', fill: '#d97706' };
    return { text: 'text-red-700', border: 'border-red-200', bg: 'bg-red-50', fill: '#dc2626' };
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-teal-600"></div>
        <p className="mt-2 text-sm">Loading agency records...</p>
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="card p-8 border-red-200">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Agency Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">{error || 'Agency does not exist in our directory.'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const scoreStyle = getScoreStyle(agency.trust_score);
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (agency.trust_score / 100) * circumference;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      
      {/* Back Link */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Directory
      </Link>

      {/* Agency Header */}
      <div className="card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{agency.name}</h1>
            {agency.is_verified ? (
              <span className="badge-teal text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" /> Legitimate & Trusted
              </span>
            ) : (
              <span className="badge-slate text-xs">Community Rated</span>
            )}
          </div>
          <p className="text-slate-500 flex items-center gap-1.5 justify-center md:justify-start">
            <MapPin className="h-4 w-4" />
            {agency.location}
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-slate-400">
            <span>{parseFloat(agency.latitude).toFixed(4)}° N, {parseFloat(agency.longitude).toFixed(4)}° E</span>
            <span>&middot;</span>
            <span>{reports.length} scam alert{reports.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Trust Score Circle */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg className="h-full w-full -rotate-90">
              <circle cx="56" cy="56" r={radius} className="stroke-slate-200" strokeWidth={strokeWidth} fill="transparent" />
              <circle
                cx="56" cy="56" r={radius}
                stroke={scoreStyle.fill}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <span className="text-2xl font-black text-slate-900 leading-none">{agency.trust_score}%</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Trust Score</span>
            </div>
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider ${scoreStyle.text}`}>
            {agency.trust_score >= 80 ? 'Verified Safe' : agency.trust_score >= 50 ? 'Proceed with Caution' : 'High Scam Risk'}
          </span>
        </div>
      </div>

      {/* Reports Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-500" />
          Scam Reports ({reports.length})
        </h2>
        <Link
          to={`/report?agencyId=${agency.id}&agencyName=${encodeURIComponent(agency.name)}`}
          className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-all"
        >
          + Report Scam
        </Link>
      </div>

      {/* Reports */}
      {reports.length === 0 ? (
        <div className="card p-10 text-center">
          <Shield className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No scam reports registered</p>
          <p className="text-xs text-slate-400 mt-1">This agency has a clean record from the community.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="card p-5 sm:p-6 space-y-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-3 flex-1">
                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {report.reporter_name || 'Anonymous'}
                    </span>
                    <span>&middot;</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(report.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {report.description}
                  </p>

                  <RedFlagBadge flags={report.red_flags} />

                  {report.evidence_url && (
                    <a
                      href={report.evidence_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 border border-teal-200 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-all shadow-sm"
                    >
                      <FileUp className="h-3.5 w-3.5" />
                      View Evidence
                    </a>
                  )}
                </div>

                {/* Voting */}
                <div className="flex md:flex-col items-center justify-start md:justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-5 gap-3">
                  <div className="hidden md:block text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm?</span>
                  </div>
                  <div className="flex md:flex-col gap-2">
                    <button
                      onClick={() => handleVote(report.id, 'upvote')}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm transition-all ${
                        report.user_vote === 'upvote'
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                      title="Confirm scam"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {report.upvotes}
                    </button>
                    <button
                      onClick={() => handleVote(report.id, 'downvote')}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm transition-all ${
                        report.user_vote === 'downvote'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                      title="Contest report"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      {report.downvotes}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
