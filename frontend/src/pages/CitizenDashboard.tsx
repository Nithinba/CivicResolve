import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { complaintsAPI } from '../services/api';
import { Complaint } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatsCard } from '../components/StatsCard';
import { ComplaintCard } from '../components/ComplaintCard';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchComplaints = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setRefreshing(true);
    try {
      const res = await complaintsAPI.getComplaints({
        limit: 50,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setComplaints(res.items);
    } catch (err) {
      console.error('Error fetching citizen complaints:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  // Derived counts
  const totalCount = complaints.length;
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;
  const criticalCount = complaints.filter(
    (c) => c.ai_analysis?.priority === 'Critical' && c.status !== 'resolved'
  ).length;

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.complaint_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location_text.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            Citizen Grievance Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track and monitor the resolution progress of your neighborhood civic submissions.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => fetchComplaints(true)}
            disabled={refreshing}
            className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            title="Refresh status"
            aria-label="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <Link
            to="/submit-complaint"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all text-sm"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Report Issue
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Lodged"
          value={totalCount}
          icon={FileText}
          color="blue"
          subtitle="All submissions"
        />
        <StatsCard
          title="In Progress"
          value={inProgressCount}
          icon={Clock}
          color="indigo"
          subtitle="Field crew assigned"
        />
        <StatsCard
          title="Resolved"
          value={resolvedCount}
          icon={CheckCircle2}
          color="green"
          subtitle="Verified & closed"
        />
        <StatsCard
          title="Critical Flags"
          value={criticalCount}
          icon={AlertTriangle}
          color="red"
          subtitle="High urgency safety risks"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, ID, or location..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="reported">Reported</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Your Civic Reports</h2>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12">
            <LoadingSpinner text="Loading your reported issues..." />
          </div>
        ) : filteredComplaints.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredComplaints.map((c) => (
              <ComplaintCard key={c.id} complaint={c} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">No Complaints Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchTerm || statusFilter !== 'all'
                  ? 'No grievances match your current search or status filter criteria.'
                  : 'You have not reported any civic infrastructure issues yet.'}
              </p>
            </div>
            {!searchTerm && statusFilter === 'all' && (
              <Link
                to="/submit-complaint"
                className="inline-flex items-center px-4 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white text-xs shadow-sm transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Report First Issue
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
