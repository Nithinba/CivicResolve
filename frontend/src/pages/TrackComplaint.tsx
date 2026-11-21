import React, { useState } from 'react';
import { Search, Shield, Building2, Calendar, Clock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { complaintsAPI } from '../services/api';
import { TrackingResult } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const TrackComplaint: React.FC = () => {
  const [complaintId, setComplaintId] = useState('');
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = complaintId.trim();
    if (!cleanId) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await complaintsAPI.track(cleanId);
      setResult(data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          'Grievance ID not found. Please verify the ID format (e.g., CIV-261121-12345).'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8 space-y-8">
      {/* Search Header */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          <Search className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Public Grievance Tracker
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Enter your unique municipal complaint ID to inspect real-time remediation status and department actions.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSearch} className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              placeholder="e.g. CIV-261121-60307"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white text-sm shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center shrink-0"
          >
            {loading ? 'Searching...' : 'Track Status'}
          </button>
        </div>
      </form>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8">
          <LoadingSpinner text="Searching civic municipal database..." />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs sm:text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">No Records Located</p>
            <p className="mt-0.5 text-xs text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                {result.complaint_id}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">{result.title}</h2>
            </div>
            <div className="flex items-center space-x-2">
              {result.priority && <PriorityBadge priority={result.priority} />}
              <StatusBadge status={result.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong>Assigned Authority:</strong>{' '}
                {result.department_name || 'Pending routing'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong>Lodged Date:</strong>{' '}
                {new Date(result.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong>Last Activity:</strong>{' '}
                {new Date(result.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {result.latest_update_remarks && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                Latest Administrative Action
              </p>
              <p className="text-slate-800 font-medium">{result.latest_update_remarks}</p>
            </div>
          )}

          <div className="text-[11px] text-slate-400 text-center pt-2">
            Citizen personal identifiable information is securely protected on public tracking endpoints.
          </div>
        </div>
      )}
    </div>
  );
};
