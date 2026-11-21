import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Building2, ChevronRight, Sparkles } from 'lucide-react';
import { Complaint } from '../types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';

interface ComplaintCardProps {
  complaint: Complaint;
  isAdminView?: boolean;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({
  complaint,
  isAdminView = false,
}) => {
  const detailUrl = isAdminView
    ? `/admin/complaints/${complaint.id}`
    : `/complaints/${complaint.id}`;

  const formattedDate = new Date(complaint.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      to={detailUrl}
      className="block bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-blue-400 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
            {complaint.complaint_id}
          </span>
          <span className="text-xs text-gray-400">•</span>
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
            {formattedDate}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {complaint.ai_analysis && (
            <PriorityBadge priority={complaint.ai_analysis.priority} />
          )}
          <StatusBadge status={complaint.status} />
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 line-clamp-1">
          {complaint.title}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
          {complaint.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
            <span className="truncate max-w-[180px]">{complaint.location_text}</span>
          </div>

          <div className="flex items-center">
            <Building2 className="w-3.5 h-3.5 mr-1 text-gray-400" />
            <span>
              {complaint.department?.name ||
                complaint.ai_analysis?.department ||
                'Unassigned'}
            </span>
          </div>
        </div>

        <div className="flex items-center text-blue-600 font-semibold text-xs ml-auto">
          {complaint.ai_analysis && (
            <span className="inline-flex items-center text-indigo-600 mr-2 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
              <Sparkles className="w-3 h-3 mr-0.5" />
              AI Verified
            </span>
          )}
          View Details
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </div>
      </div>
    </Link>
  );
};
