import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, Search, PlusCircle, Building, MapPin, Map } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function AdminPanel({ setServedBy }) {
  const [agencies, setAgencies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadAgencies = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/agencies', {}, setServedBy);
      setAgencies(data);
    } catch (err) {
      console.error('Error loading agencies:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setServedBy]);

  const handleToggleVerify = async (agencyId, currentStatus) => {
    try {
      setActionLoading(agencyId);
      const nextStatus = !currentStatus;
      await apiFetch(`/agencies/${agencyId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ is_verified: nextStatus })
      }, setServedBy);

      setAgencies(prev => 
        prev.map(a => {
          if (a.id === agencyId) {
            return {
              ...a,
              is_verified: nextStatus,
              trust_score: nextStatus ? Math.max(a.trust_score, 90) : a.trust_score
            };
          }
          return a;
        })
      );
    } catch (err) {
      console.error('Verify error:', err.message);
      alert('Failed to toggle verification: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddAgency = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !location) {
      setError('Agency name and location are required.');
      return;
    }

    try {
      const body = { name, location };
      if (latitude !== '') body.latitude = parseFloat(latitude);
      if (longitude !== '') body.longitude = parseFloat(longitude);

      const newAgency = await apiFetch('/agencies', {
        method: 'POST',
        body: JSON.stringify(body)
      }, setServedBy);

      await apiFetch(`/agencies/${newAgency.id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ is_verified: true })
      }, setServedBy);

      setSuccess(`"${name}" successfully registered and verified.`);
      setName('');
      setLocation('');
      setLatitude('');
      setLongitude('');
      loadAgencies();
    } catch (err) {
      console.error('Create and verify error:', err.message);
      setError(err.message || 'Failed to create agency.');
    }
  };

  const filteredAgencies = agencies.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-teal-600">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-sm text-slate-500">Manage agency verification and directory</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Agency Registry */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <h2 className="text-lg font-bold text-slate-900">Agency Registry</h2>
            
            <div className="relative rounded-lg min-w-[220px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input type="text" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registry..."
                className="block w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100"></div>
              ))}
            </div>
          ) : filteredAgencies.length === 0 ? (
            <div className="card p-8 text-center text-sm text-slate-500">
              No matching agency records.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAgencies.map((agency) => (
                <div key={agency.id} className="card flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{agency.name}</span>
                      <span className="text-xs text-slate-400">{agency.location}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>Trust: <span className={
                        agency.trust_score >= 80 ? 'text-emerald-600 font-semibold' : 
                        agency.trust_score >= 50 ? 'text-amber-600 font-semibold' : 
                        'text-red-600 font-semibold'
                      }>{agency.trust_score}%</span></span>
                      <span>Reports: {agency.report_count || 0}</span>
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => handleToggleVerify(agency.id, agency.is_verified)}
                      disabled={actionLoading === agency.id}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold shadow-sm transition-all focus:outline-none disabled:opacity-50 ${
                        agency.is_verified
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {agency.is_verified ? (
                        <><CheckCircle2 className="h-4 w-4" /> Revoke Trust</>
                      ) : (
                        <><ShieldCheck className="h-4 w-4" /> Verify Agency</>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Agency Form */}
        <div className="lg:col-span-1">
          <div className="card p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
              <PlusCircle className="h-5 w-5 text-teal-600" />
              Register Agency
            </h2>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleAddAgency} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Building className="h-3.5 w-3.5" /> Agency Name
                </label>
                <input type="text" required value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Overseas Employment Bureau"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Location
                </label>
                <input type="text" required value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Islamabad, Pakistan"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 flex items-center gap-0.5">
                    <Map className="h-3 w-3" /> Latitude (opt)
                  </label>
                  <input type="number" step="0.000001" value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="33.68"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-teal-500 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 flex items-center gap-0.5">
                    <Map className="h-3 w-3" /> Longitude (opt)
                  </label>
                  <input type="number" step="0.000001" value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="73.04"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-teal-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit"
                  className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  Create & Verify
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
