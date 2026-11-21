import React, { useEffect, useState } from 'react';
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
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Building,
  RefreshCw,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { analyticsAPI } from '../services/api';
import { AnalyticsOverview, DepartmentAnalytics } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#dc2626',
  High: '#f59e0b',
  Medium: '#eab308',
  Low: '#10b981',
};

const CATEGORY_COLORS = ['#2563eb', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const Analytics: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [deptAnalytics, setDeptAnalytics] = useState<DepartmentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const [ovData, deptData] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getDepartments(),
      ]);
      setOverview(ovData);
      setDeptAnalytics(deptData.departments);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 my-8">
        <LoadingSpinner text="Computing civic intelligence analytics from municipal database..." />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center p-12 bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-500 text-sm">Failed to generate analytics.</p>
        <button
          onClick={() => fetchData(true)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  // Format data for charts
  const catData = overview.category_distribution.map((c) => ({
    name: c.label,
    count: c.count,
  }));

  const priorityData = overview.priority_distribution.map((p) => ({
    name: p.label,
    value: p.count,
    color: PRIORITY_COLORS[p.label] || '#64748b',
  }));

  const trendData = overview.monthly_trends.map((t) => ({
    month: t.month,
    complaints: t.count,
  }));

  const statusData = overview.status_distribution.map((s) => ({
    name: s.label.replace('_', ' ').toUpperCase(),
    count: s.count,
  }));

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            Civic Intelligence Analytics
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Operations & Performance Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data-driven intelligence synthesized directly from live municipal database records.
          </p>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all self-start sm:self-center"
          title="Refresh analytics"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Top Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
              Incidents by Civic Infrastructure Category
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">Total volume</span>
          </div>

          <div className="h-64 w-full">
            {catData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catData} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
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
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No data available.
              </div>
            )}
          </div>
        </div>

        {/* Priority Urgency Pie Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <PieIcon className="w-4 h-4 mr-2 text-indigo-600" />
              AI Priority & Urgency Distribution
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">Risk-weighted</span>
          </div>

          <div className="h-64 w-full">
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
                No data available.
              </div>
            )}
          </div>
        </div>

        {/* Monthly Submission Trend Area Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-emerald-600" />
              Monthly Incident Inflow Trends
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">Timeline</span>
          </div>

          <div className="h-64 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="complaints"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No trend data available.
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution Horizontal Bar Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-amber-600" />
              Operational Lifecycle Pipeline
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">Current status</span>
          </div>

          <div className="h-64 w-full">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 10 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No status data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Department Performance Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <Building className="w-5 h-5 mr-2 text-blue-600" />
              Department-Wise Remediation Performance
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative efficiency benchmarks across municipal divisions
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3 rounded-l-xl">Municipal Department</th>
                <th className="px-5 py-3">Total Assigned</th>
                <th className="px-5 py-3">Resolved</th>
                <th className="px-5 py-3">Resolution Rate</th>
                <th className="px-5 py-3 rounded-r-xl">Avg Resolution Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {deptAnalytics.map((dept) => {
                const rate = dept.total_complaints > 0
                  ? Math.round((dept.resolved_complaints / dept.total_complaints) * 100)
                  : 0;

                return (
                  <tr key={dept.department_name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {dept.department_name}
                    </td>
                    <td className="px-5 py-3.5">{dept.total_complaints}</td>
                    <td className="px-5 py-3.5 text-emerald-600 font-bold">
                      {dept.resolved_complaints}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">{rate}%</span>
                        <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {dept.avg_resolution_days > 0 ? (
                        <span className="font-bold text-slate-700">
                          {dept.avg_resolution_days} days
                        </span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
