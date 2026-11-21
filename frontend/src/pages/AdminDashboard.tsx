import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  BarChart2,
  Building,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { adminAPI } from '../services/api';
import { DashboardStats } from '../types';
import { StatsCard } from '../components/StatsCard';
import { ComplaintCard } from '../components/ComplaintCard';
import { LoadingSpinner } from '../components/LoadingSpinner';

const COLORS = ['#2563eb', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const data = await adminAPI.getDashboard();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 my-8">
        <LoadingSpinner text="Connecting to municipal operational data feed..." />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-12 bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-500 text-sm">Unable to load dashboard metrics.</p>
        <button
          onClick={() => fetchStats(true)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  // Prepare chart data
  const deptChartData = stats.by_department.map((d) => ({
    name: d.name.replace(' Department', ''),
    complaints: d.count,
  }));

  const catChartData = stats.by_category.map((c) => ({
    name: c.category,
    value: c.count,
  }));

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
            Municipal Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Civic Operations Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time live monitoring of civic grievances, AI urgency analysis, and department resolution workloads.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            title="Refresh statistics"
            aria-label="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <Link
            to="/admin/complaints"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white text-xs shadow-md shadow-blue-500/20 transition-all"
          >
            Manage Queue
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Total Reports"
          value={stats.total_complaints}
          icon={FileText}
          color="blue"
        />
        <StatsCard
          title="Reported"
          value={stats.reported_count}
          icon={FileText}
          color="indigo"
        />
        <StatsCard
          title="In Progress"
          value={stats.in_progress_count}
          icon={Clock}
          color="blue"
        />
        <StatsCard
          title="Critical Alerts"
          value={stats.critical_count}
          icon={AlertTriangle}
          color="red"
        />
        <StatsCard
          title="Resolved"
          value={stats.resolved_count}
          icon={CheckCircle2}
          color="green"
        />
        <StatsCard
          title="Rejected"
          value={stats.rejected_count}
          icon={XCircle}
          color="amber"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution Bar Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <Building className="w-4 h-4 mr-2 text-blue-600" />
              Department Workload Distribution
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">Live DB Records</span>
          </div>

          <div className="h-64 w-full">
            {deptChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="complaints" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No complaint records to graph yet.
              </div>
            )}
          </div>
        </div>

        {/* Issue Category Pie Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <BarChart2 className="w-4 h-4 mr-2 text-indigo-600" />
              Gemini AI Category Distribution
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">Auto-Classified</span>
          </div>

          <div className="h-64 w-full">
            {catChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={catChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {catChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No classified complaints to display.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Complaints Stream */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Incident Submissions</h2>
          <Link
            to="/admin/complaints"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center"
          >
            View Complete Queue
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {stats.recent_complaints.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.recent_complaints.map((c) => (
              <ComplaintCard key={c.id} complaint={c} isAdminView={true} />
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
            No complaints submitted yet.
          </div>
        )}
      </div>
    </div>
  );
};
