import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Building2,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  History,
  Image as ImageIcon,
} from 'lucide-react';
import { complaintsAPI } from '../services/api';
import { Complaint } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { AIAnalysisCard } from '../components/AIAnalysisCard';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const ComplaintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        const data = await complaintsAPI.getComplaintById(parseInt(id, 10));
        setComplaint(data);
      } catch (err: any) {
        setError(
          err.response?.data?.detail || 'Unable to load grievance details. You may not be authorized.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 my-8">
        <LoadingSpinner text="Retrieving official grievance dossier..." />
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 my-8">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Denied or Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'Grievance could not be found.'}</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center px-4 py-2 rounded-xl font-bold bg-blue-600 text-white text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const createdDate = new Date(complaint.created_at).toLocaleString();
  const updatedDate = new Date(complaint.updated_at).toLocaleString();

  return (
    <div className="space-y-8 max-w-4xl mx-auto my-4">
      {/* Back button */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Grievances
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                {complaint.complaint_id}
              </span>
              <span className="text-xs text-slate-400">Lodged on {createdDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {complaint.title}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            {complaint.ai_analysis && (
              <PriorityBadge priority={complaint.ai_analysis.priority} />
            )}
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        {/* Overview Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate"><strong>Location:</strong> {complaint.location_text}</span>
          </div>

          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">
              <strong>Department:</strong>{' '}
              {complaint.department?.name ||
                complaint.ai_analysis?.department ||
                'Pending Assignment'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span><strong>Last Updated:</strong> {updatedDate}</span>
          </div>
        </div>

        {/* Problem Description */}
        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Citizen Statement
          </h2>
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {complaint.description}
          </p>
        </div>

        {/* Evidence Photo */}
        {complaint.image_path && (
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center">
              <ImageIcon className="w-3.5 h-3.5 mr-1" />
              Attached Photographic Evidence
            </h2>
            <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-96 w-fit bg-slate-900">
              <img
                src={`http://localhost:8000/${complaint.image_path.replace(/\\/g, '/')}`}
                alt="Submitted evidence"
                className="max-h-96 object-contain rounded-2xl"
              />
            </div>
          </div>
        )}
      </div>

      {/* Official Resolution Card (if resolved) */}
      {complaint.status === 'resolved' && complaint.resolution && (
        <div className="bg-emerald-50/80 rounded-3xl border-2 border-emerald-300 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center space-x-3 text-emerald-800">
            <div className="p-2.5 bg-emerald-200 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                Official Municipal Resolution
              </span>
              <h2 className="text-lg font-extrabold text-emerald-950 mt-0.5">
                Issue Verified & Remediated
              </h2>
            </div>
          </div>

          <div className="bg-white/90 p-4 rounded-2xl border border-emerald-200 text-xs sm:text-sm space-y-2">
            <p className="font-semibold text-slate-900">
              {complaint.resolution.resolution_description}
            </p>
            {complaint.resolution.admin_remarks && (
              <p className="text-xs text-slate-600 italic">
                <strong>Administrative Remarks:</strong> {complaint.resolution.admin_remarks}
              </p>
            )}
            <p className="text-[11px] text-slate-400 pt-1">
              Resolved on {new Date(complaint.resolution.resolution_date).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Gemini AI Intelligence Dossier */}
      {complaint.ai_analysis && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            AI Automated Assessment & Urgency Metrics
          </h2>
          <AIAnalysisCard analysis={complaint.ai_analysis} />
        </div>
      )}

      {/* Status History Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center">
          <History className="w-4 h-4 mr-2 text-blue-600" />
          Resolution & Audit Trail
        </h2>

        {complaint.updates && complaint.updates.length > 0 ? (
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 ml-1">
            {complaint.updates.map((upd) => (
              <div key={upd.id} className="relative flex items-start space-x-3.5 text-xs">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 border-2 border-white shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 capitalize">
                      Status transitioned to: {upd.new_status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(upd.created_at).toLocaleString()}
                    </span>
                  </div>
                  {upd.remarks && <p className="text-slate-600">{upd.remarks}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No administrative updates logged yet.</p>
        )}
      </div>
    </div>
  );
};
