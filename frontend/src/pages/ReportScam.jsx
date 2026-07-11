import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, Building, MapPin, FileUp, AlertOctagon } from 'lucide-react';
import { apiFetch } from '../utils/api';

const CLIENT_SCAM_KEYWORDS = [
  { phrase: 'pay before visa', label: 'Payment requested prior to visa' },
  { phrase: 'processing fee', label: 'Upfront processing fees' },
  { phrase: 'visa fee', label: 'Upfront visa fees' },
  { phrase: 'deposit required', label: 'Upfront cash deposit' },
  { phrase: 'no written contract', label: 'No formal written contract' },
  { phrase: 'tourist visa for work', label: 'Suggesting work on tourist visa' },
  { phrase: 'guaranteed visa', label: 'Guaranteed visa promise' },
  { phrase: 'training fee', label: 'Mandatory paid training' },
  { phrase: 'medical fee', label: 'Clinic medical checkup fees' },
  { phrase: 'keep original passport', label: 'Surrendering original passport' },
  { phrase: 'charge for interview', label: 'Interview fee charges' }
];

export default function ReportScam({ setServedBy }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryAgencyId = searchParams.get('agencyId');
  const queryAgencyName = searchParams.get('agencyName');

  const [agenciesList, setAgenciesList] = useState([]);
  const [isNewAgency, setIsNewAgency] = useState(!queryAgencyId);
  const [selectedAgencyId, setSelectedAgencyId] = useState(queryAgencyId || '');
  
  const [newAgencyName, setNewAgencyName] = useState('');
  const [newAgencyLocation, setNewAgencyLocation] = useState('');
  
  const [description, setDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  
  const [detectedFlags, setDetectedFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const data = await apiFetch('/agencies', {}, setServedBy);
        setAgenciesList(data);
      } catch (err) {
        console.error('Failed to load agencies list:', err.message);
      }
    };
    fetchAgencies();
  }, [setServedBy]);

  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setDescription(val);

    const valLower = val.toLowerCase();
    const matches = [];
    CLIENT_SCAM_KEYWORDS.forEach(item => {
      if (valLower.includes(item.phrase)) {
        matches.push(item.label);
      }
    });
    setDetectedFlags(matches);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEvidenceFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isNewAgency && (!newAgencyName || !newAgencyLocation)) {
      setError('Please provide the agency name and operating region.');
      return;
    }
    if (!isNewAgency && !selectedAgencyId) {
      setError('Please select an agency from the directory.');
      return;
    }
    if (!description || description.trim().length < 20) {
      setError('Please provide a detailed scam description (at least 20 characters).');
      return;
    }

    try {
      setLoading(true);
      let targetAgencyId = selectedAgencyId;

      if (isNewAgency) {
        const agencyRes = await apiFetch('/agencies', {
          method: 'POST',
          body: JSON.stringify({
            name: newAgencyName,
            location: newAgencyLocation
          })
        }, setServedBy);
        targetAgencyId = agencyRes.id;
      }

      const formData = new FormData();
      formData.append('agency_id', targetAgencyId);
      formData.append('description', description);
      if (evidenceFile) {
        formData.append('evidence', evidenceFile);
      }

      await apiFetch('/reports', {
        method: 'POST',
        body: formData
      }, setServedBy);

      navigate(`/agency/${targetAgencyId}`);
    } catch (err) {
      console.error('Submit report error:', err.message);
      setError(err.message || 'Failed to submit scam report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-5 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 border border-red-200 text-red-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Report a Scam</h1>
          <p className="text-sm text-slate-500">Submit a fraud alert for a recruitment agency</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-6">
        
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Agency Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="text-sm font-bold text-slate-700">1. Agency Details</span>
            {queryAgencyId ? (
              <span className="text-xs text-slate-400">Fixed: {queryAgencyName}</span>
            ) : (
              <button
                type="button"
                onClick={() => setIsNewAgency(!isNewAgency)}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
              >
                {isNewAgency ? 'Select existing agency' : 'Report unlisted agency'}
              </button>
            )}
          </div>

          {isNewAgency ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Building className="h-3.5 w-3.5" /> Agency Name
                </label>
                <input type="text" required value={newAgencyName}
                  onChange={(e) => setNewAgencyName(e.target.value)}
                  placeholder="e.g. Gulf Horizons"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Operating Region
                </label>
                <input type="text" required value={newAgencyLocation}
                  onChange={(e) => setNewAgencyLocation(e.target.value)}
                  placeholder="e.g. Mumbai, India"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Building className="h-3.5 w-3.5" /> Select Agency
              </label>
              <select required value={selectedAgencyId}
                onChange={(e) => setSelectedAgencyId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
              >
                <option value="" disabled>-- Choose Agency --</option>
                {agenciesList.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.location})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-700">2. Describe the Scam</label>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider">Live Scan Active</span>
          </div>
          <textarea required rows="5" value={description}
            onChange={handleDescriptionChange}
            placeholder="Provide detailed information. Did they charge fees? Refuse a written contract? Mention specific amounts and dates."
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all leading-relaxed"
          ></textarea>

          {detectedFlags.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mt-2 space-y-2.5">
              <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                <AlertOctagon className="h-4 w-4" /> Red Flags Detected:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {detectedFlags.map((flag, idx) => (
                  <span key={idx}
                    className="inline-flex items-center gap-1.5 rounded bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-700"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
            3. Upload Evidence <span className="text-xs text-slate-400 font-normal">(Optional)</span>
          </label>
          <p className="text-xs text-slate-400 mb-2">
            Upload screenshots, contracts, receipts, or demand letters (JPEG/PNG/PDF up to 10MB).
          </p>
          <div className="relative rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-6 px-4 hover:bg-teal-50/50 hover:border-teal-300 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer">
            <input type="file" accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <FileUp className="h-8 w-8 text-slate-400" />
            <span className="text-xs text-slate-500 font-semibold">
              {evidenceFile ? `Selected: ${evidenceFile.name}` : 'Click to select or drop file here'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Max 10MB</span>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-red-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Publish Scam Alert'}
          </button>
        </div>

      </form>
    </div>
  );
}
