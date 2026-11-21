import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  AlertTriangle,
} from 'lucide-react';
import { adminAPI, departmentsAPI } from '../services/api';
import { Complaint, Department } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const AdminComplaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDepartments = async () => {
    try {
      const data = await departmentsAPI.getAll();
      setDepartments(data);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const fetchComplaints = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    setLoading(true);
    try {
      const res = await adminAPI.getComplaints({
        page,
        limit: 10,
        status: status || undefined,
        priority: priority || undefined,
        category: category || undefined,
        department_id: departmentId !== '' ? Number(departmentId) : undefined,
        search: search.trim() || undefined,
      });

      setComplaints(res.items);
      setTotalPages(res.pages);
      setTotalCount(res.total);
    } catch (err) {
      console.error('Failed to load admin complaints:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [page, status, priority, category, departmentId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setCategory('');
    setDepartmentId('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || status || priority || category || departmentId !== '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            Grievance Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Municipal Complaints Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review, prioritize, dispatch field departments, and manage complaints ({totalCount} total records).
          </p>
        </div>

        <button
          onClick={() => fetchComplaints(true)}
          disabled={refreshing}
          className="p-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all self-start sm:self-center"
          title="Refresh table"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keywords, ID, title, or address..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm transition-colors"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="reported">Reported</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none truncate"
          >
            <option value="">All Categories</option>
            <option value="Road Infrastructure">Road Infrastructure</option>
            <option value="Waste Management">Waste Management</option>
            <option value="Water Supply">Water Supply</option>
            <option value="Electricity and Streetlights">Electricity & Lights</option>
            <option value="Drainage and Sanitation">Drainage & Sanitation</option>
            <option value="Public Safety">Public Safety</option>
            <option value="Other Civic Issues">Other Civic Issues</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value === '' ? '' : Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none truncate"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Filtered view active</span>
            <button
              onClick={clearFilters}
              className="text-red-600 hover:text-red-700 font-semibold flex items-center"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Complaints Table (Desktop) / Cards (Mobile) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner text="Loading complaints queue..." />
          </div>
        ) : complaints.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">ID / Date</th>
                    <th className="px-5 py-3.5">Title & Location</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Priority</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 block w-fit">
                          {c.complaint_id}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900 line-clamp-1 max-w-xs">{c.title}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{c.location_text}</p>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-slate-700">
                        {c.ai_analysis?.issue_category || 'General'}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {c.ai_analysis && <PriorityBadge priority={c.ai_analysis.priority} />}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={c.status} />
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        <span className="truncate block max-w-[150px]">
                          {c.department?.name || c.ai_analysis?.department || 'Unassigned'}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/admin/complaints/${c.id}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
              {complaints.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700">{c.complaint_id}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                  <p className="text-xs text-slate-500">{c.location_text}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    {c.ai_analysis && <PriorityBadge priority={c.ai_analysis.priority} />}
                    <Link
                      to={`/admin/complaints/${c.id}`}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500">
              <span>
                Page {page} of {totalPages} ({totalCount} items)
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Complaints Match Filters</h3>
            <p className="text-xs text-slate-400">
              Try adjusting your search criteria or resetting filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
