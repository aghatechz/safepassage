import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Map, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../utils/api';

const createCustomMarker = (reportCount, avgTrustScore) => {
  let markerColor = '#dc2626';
  let shadowColor = 'rgba(220, 38, 38, 0.4)';
  
  if (avgTrustScore >= 80) {
    markerColor = '#059669';
    shadowColor = 'rgba(5, 150, 105, 0.4)';
  } else if (avgTrustScore >= 50) {
    markerColor = '#d97706';
    shadowColor = 'rgba(217, 119, 6, 0.4)';
  }

  const size = Math.min(48, Math.max(32, 32 + (reportCount * 1.5)));

  return L.divIcon({
    html: `
      <div style="
        background-color: ${markerColor};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px ${shadowColor};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 800;
        font-size: 11px;
        font-family: 'Inter', sans-serif;
      ">
        ${reportCount}
      </div>
    `,
    className: 'leaflet-scam-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

export default function MapView({ setServedBy }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMapStats = async () => {
      try {
        setLoading(true);
        const data = await apiFetch('/reports/stats', {}, setServedBy);
        setStats(data);
      } catch (err) {
        console.error('Error fetching map stats:', err.message);
        setError('Could not load map coordinates from API.');
      } finally {
        setLoading(false);
      }
    };

    fetchMapStats();
  }, [setServedBy]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
            <Map className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Scam Heatmap</h1>
            <p className="text-sm text-slate-500">Geographical density of reported job scams</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-600"></span> Low Risk (&gt;80)</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-600"></span> Moderate (50-79)</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-600"></span> High Risk (&lt;50)</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Map Frame */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-elevated">
        {loading ? (
          <div className="h-[550px] flex flex-col items-center justify-center text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-teal-600"></div>
            <p className="mt-2 text-sm font-semibold">Loading geographic data...</p>
          </div>
        ) : (
          <MapContainer 
            center={[21.0, 90.0]} 
            zoom={4.5} 
            scrollWheelZoom={true}
            style={{ height: '550px', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {stats.map((region, idx) => (
              <Marker
                key={idx}
                position={[parseFloat(region.latitude), parseFloat(region.longitude)]}
                icon={createCustomMarker(region.report_count, region.average_trust_score)}
              >
                <Popup>
                  <div className="p-1 space-y-3 min-w-[220px]">
                    <div className="border-b border-slate-200 pb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Region</span>
                      <span className="text-sm font-bold text-slate-900 block">{region.location}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Reports</span>
                        <span className="text-xs font-extrabold text-red-600">{region.report_count}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Avg Trust</span>
                        <span className={`text-xs font-extrabold ${region.average_trust_score >= 80 ? 'text-emerald-600' : region.average_trust_score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {Math.round(region.average_trust_score)}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Agencies:</span>
                      {region.agencies && region.agencies.map((agency) => (
                        <Link
                          key={agency.id}
                          to={`/agency/${agency.id}`}
                          className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200 hover:border-teal-300 transition-colors text-[11px] block"
                        >
                          <span className="font-semibold text-slate-700 truncate max-w-[130px]" title={agency.name}>
                            {agency.name}
                          </span>
                          <span className={`font-mono font-bold ${agency.trust_score >= 80 ? 'text-emerald-600' : agency.trust_score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {agency.trust_score}%
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
