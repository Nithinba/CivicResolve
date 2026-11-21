import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Send,
  Sparkles,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { adminAPI, departmentsAPI } from '../services/api';
import { Complaint, Department } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { AIAnalysisCard } from '../components/AIAnalysisCard';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const AdminComplaintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for admin actions
  const [newStatus, setNewStatus] = useState<'in_progress' | 'reported'>('in_progress');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('');
  const [resolutionDesc, setResolutionDesc] = useState('');
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const fetchComplaintData = async () => {
    if (!id) return;
    try {
      const [compData, deptData] = await Promise.all([
        adminAPI.getComplaintById(parseInt(id, 10)),
        departmentsAPI.getAll(),
      ]);
      setComplaint(compData);
      setDepartments(deptData);
      if (compData.department_id) {
        setSelectedDeptId(compData.department_id);
      }
      setNewStatus(compData.status === 'reported' ? 'in_progress' : 'reported');
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to load complaint dossier.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintData();
  }, [id]);

  // Action 1: Update Status
  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const updated = await adminAPI.updateStatus(complaint.id, {
        status: newStatus,
        remarks: statusRemarks.trim() || undefined,
      });
      setComplaint(updated);
      setStatusRemarks('');
      setFeedback({ type: 'success', text: `Status updated to ${newStatus.replace('_', ' ')}.` });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to update status.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Action 2: Update Department Assignment
  const handleDepartmentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !selectedDeptId) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const updated = await adminAPI.updateDepartment(complaint.id, Number(selectedDeptId));
      setComplaint(updated);
      setFeedback({ type: 'success', text: 'Department reassignment saved successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to assign department.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Action 3: Resolve Complaint
  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !resolutionDesc.trim()) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const updated = await adminAPI.resolve(complaint.id, {
        resolution_description: resolutionDesc.trim(),
        admin_remarks: resolutionRemarks.trim() || undefined,
      });
      setComplaint(updated);
      setResolutionDesc('');
      setResolutionRemarks('');
      setFeedback({ type: 'success', text: 'Complaint officially resolved and logged in public tracker.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to resolve complaint.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Action 4: Reject Complaint
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || rejectReason.trim().length < 10) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const updated = await adminAPI.reject(complaint.id, rejectReason.trim());
      setComplaint(updated);
      setRejectReason('');
      setFeedback({ type: 'success', text: 'Complaint marked as Rejected with mandatory reason.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to reject complaint.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 my-8">
        <LoadingSpinner text="Retrieving administrative dossier..." />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="text-center p-12 bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-500 text-sm">Complaint not found.</p>
        <Link to="/admin/complaints" className="mt-4 text-blue-600 font-bold text-xs inline-block">
          Return to Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto my-4">
      {/* Navigation */}
      <div>
        <Link
          to="/admin/complaints"
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Grievance Queue
        </Link>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-2 ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-5 h-5 text-green-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Grid: Left Details & Right Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) - Complaint Dossier & AI Findings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                  {complaint.complaint_id}
                </span>
                <h1 className="text-2xl font-black text-slate-900 mt-2">{complaint.title}</h1>
              </div>
              <div className="flex items-center space-x-2">
                {complaint.ai_analysis && (
                  <PriorityBadge priority={complaint.ai_analysis.priority} />
                )}
                <StatusBadge status={complaint.status} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate"><strong>Location:</strong> {complaint.location_text}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong>Assigned Department:</strong>{' '}
                  {complaint.department?.name || 'Unassigned'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span><strong>Lodged Date:</strong> {new Date(complaint.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span><strong>Last Updated:</strong> {new Date(complaint.updated_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Description */}
            <div className="pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Citizen Grievance Statement
              </h3>
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {complaint.description}
              </p>
            </div>

            {/* Evidence Image */}
            {complaint.image_path && (
              <div className="pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center">
                  <ImageIcon className="w-3.5 h-3.5 mr-1" />
                  Photographic Evidence
                </h3>
                <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-80 w-fit bg-slate-900">
                  <img
                    src={`http://localhost:8000/${complaint.image_path.replace(/\\/g, '/')}`}
                    alt="Evidence"
                    className="max-h-80 object-contain rounded-2xl"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Gemini AI Intelligence Dossier */}
          {complaint.ai_analysis && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Google Gemini Diagnostic Assessment
              </h2>
              <AIAnalysisCard analysis={complaint.ai_analysis} />
            </div>
          )}

          {/* Resolution Record Display (if resolved) */}
          {complaint.status === 'resolved' && complaint.resolution && (
            <div className="bg-emerald-50 rounded-3xl border-2 border-emerald-300 p-6 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Official Resolution Record</span>
              </div>
              <p className="text-xs text-slate-800 font-medium">
                {complaint.resolution.resolution_description}
              </p>
              {complaint.resolution.admin_remarks && (
                <p className="text-xs text-slate-600 italic">
                  <strong>Remarks:</strong> {complaint.resolution.admin_remarks}
                </p>
              )}
            </div>
          )}

          {/* Audit History Timeline */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <History className="w-4 h-4 mr-2 text-blue-600" />
              Administrative History Trail
            </h2>

            {complaint.updates && complaint.updates.length > 0 ? (
              <div className="space-y-3.5 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 ml-1">
                {complaint.updates.map((upd) => (
                  <div key={upd.id} className="relative flex items-start space-x-3 text-xs">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 border-2 border-white shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 capitalize">
                          Status: {upd.new_status.replace('_', ' ')}
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
              <p className="text-xs text-slate-400">No activity trail recorded yet.</p>
            )}
          </div>
        </div>

        {/* Right Column (1 Col) - Action Operations Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-24">
            <h2 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
              Administrative Actions
            </h2>

            {/* Form 1: Department Assignment */}
            <form onSubmit={handleDepartmentUpdate} className="space-y-3">
              <label htmlFor="deptAssign" className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Assign Responsible Unit
              </label>
              <select
                id="deptAssign"
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 outline-none"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={actionLoading || !selectedDeptId}
                className="w-full py-2 px-3 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white text-xs transition-colors disabled:opacity-50"
              >
                Save Department Assignment
              </button>
            </form>

            {/* Form 2: Update Status to In Progress / Reported */}
            {complaint.status !== 'resolved' && complaint.status !== 'rejected' && (
              <form onSubmit={handleStatusUpdate} className="space-y-3 pt-4 border-t border-slate-100">
                <label htmlFor="statusSelect" className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Update Operational Status
                </label>
                <select
                  id="statusSelect"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 outline-none"
                >
                  <option value="in_progress">In Progress (Dispatch Team)</option>
                  <option value="reported">Reported (Pending Review)</option>
                </select>
                <textarea
                  rows={2}
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  placeholder="Operational remarks for field team / citizen..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                />
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2 px-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white text-xs transition-colors disabled:opacity-50"
                >
                  Update Status & Log Remarks
                </button>
              </form>
            )}

            {/* Form 3: Mark as Resolved */}
            {complaint.status !== 'resolved' && (
              <form onSubmit={handleResolve} className="space-y-3 pt-4 border-t border-slate-100">
                <label htmlFor="resolveDesc" className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                  Official Remediation & Resolution
                </label>
                <textarea
                  id="resolveDesc"
                  rows={3}
                  value={resolutionDesc}
                  onChange={(e) => setResolutionDesc(e.target.value)}
                  placeholder="Detailed explanation of physical repair or remediation conducted by municipal crew..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-xs outline-none"
                />
                <input
                  type="text"
                  value={resolutionRemarks}
                  onChange={(e) => setResolutionRemarks(e.target.value)}
                  placeholder="Optional admin closure note..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                />
                <button
                  type="submit"
                  disabled={actionLoading || !resolutionDesc.trim()}
                  className="w-full py-2.5 px-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition-colors disabled:opacity-50 shadow-sm"
                >
                  Confirm Official Resolution
                </button>
              </form>
            )}

            {/* Form 4: Reject Complaint */}
            {complaint.status !== 'rejected' && complaint.status !== 'resolved' && (
              <form onSubmit={handleReject} className="space-y-3 pt-4 border-t border-slate-100">
                <label htmlFor="rejectReason" className="text-xs font-bold uppercase tracking-wider text-red-700 block">
                  Reject Grievance
                </label>
                <textarea
                  id="rejectReason"
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Mandatory justification (e.g. private property outside jurisdiction, duplicate ticket)..."
                  required
                  minLength={10}
                  className="w-full px-3 py-2 rounded-xl border border-red-200 text-xs outline-none"
                />
                <button
                  type="submit"
                  disabled={actionLoading || rejectReason.trim().length < 10}
                  className="w-full py-2 px-3 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white text-xs transition-colors disabled:opacity-50"
                >
                  Reject with Explanation
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
