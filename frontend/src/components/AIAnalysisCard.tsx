import React from 'react';
import { Sparkles, ShieldAlert, Clock, Building, Compass, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { AIAnalysis } from '../types';
import { PriorityBadge } from './PriorityBadge';

interface AIAnalysisCardProps {
  analysis: AIAnalysis;
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({ analysis }) => {
  // Severity score percentage and color
  const severityScore = Math.max(1, Math.min(10, analysis.severity_score));
  const scorePercent = (severityScore / 10) * 100;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-red-600';
    if (score >= 6) return 'bg-amber-500';
    if (score >= 4) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getRiskColor = (risk: string) => {
    const r = risk.toLowerCase();
    if (r === 'high') return 'text-red-700 bg-red-50 border-red-200';
    if (r === 'medium') return 'text-amber-700 bg-amber-50 border-amber-200';
    if (r === 'low') return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 rounded-2xl border-2 border-indigo-200/80 p-6 shadow-sm overflow-hidden relative">
      {/* Header with Google Gemini badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-indigo-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-xl text-white shadow-sm">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-gray-900">
                Google Gemini AI Intelligence Analysis
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full uppercase tracking-wider">
                Active
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Synthesized by multimodal civic language model
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <PriorityBadge priority={analysis.priority} />
        </div>
      </div>

      {/* Grid of Key AI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-5">
        {/* Severity Score Bar */}
        <div className="bg-white/80 p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-500 flex items-center">
              <AlertOctagon className="w-3.5 h-3.5 mr-1 text-indigo-500" />
              Severity Index
            </span>
            <span className="text-sm font-bold text-gray-900">{severityScore}/10</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${getScoreColor(severityScore)}`}
              style={{ width: `${scorePercent}%` }}
            />
          </div>
        </div>

        {/* Public Safety Risk */}
        <div className="bg-white/80 p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 flex items-center mb-1">
            <ShieldAlert className="w-3.5 h-3.5 mr-1 text-indigo-500" />
            Public Safety Risk
          </span>
          <span
            className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-md border ${getRiskColor(
              analysis.public_safety_risk
            )}`}
          >
            {analysis.public_safety_risk} Risk
          </span>
        </div>

        {/* Recommended Department */}
        <div className="bg-white/80 p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 flex items-center mb-1">
            <Building className="w-3.5 h-3.5 mr-1 text-indigo-500" />
            Recommended Unit
          </span>
          <p className="text-xs font-bold text-gray-900 truncate" title={analysis.department}>
            {analysis.department}
          </p>
        </div>

        {/* Estimated Time */}
        <div className="bg-white/80 p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 flex items-center mb-1">
            <Clock className="w-3.5 h-3.5 mr-1 text-indigo-500" />
            Estimated Resolution
          </span>
          <p className="text-xs font-bold text-blue-700">{analysis.estimated_resolution_time}</p>
        </div>
      </div>

      {/* Detailed AI Findings */}
      <div className="space-y-3.5 text-xs">
        <div className="bg-white/90 p-3.5 rounded-xl border border-indigo-100">
          <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px] flex items-center mb-1">
            <Compass className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            Detected Issue & Category
          </span>
          <p className="text-gray-900 font-medium">
            <strong className="text-indigo-900 font-semibold">{analysis.issue_category}:</strong>{' '}
            {analysis.detected_problem}
          </p>
        </div>

        <div className="bg-white/90 p-3.5 rounded-xl border border-indigo-100">
          <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px] flex items-center mb-1">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            Reason for Classification & Urgency
          </span>
          <p className="text-gray-800 leading-relaxed">{analysis.reason_for_classification}</p>
        </div>

        <div className="bg-white/90 p-3.5 rounded-xl border border-indigo-100">
          <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px] flex items-center mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-600" />
            Recommended Municipal Action
          </span>
          <p className="text-gray-800 leading-relaxed font-medium">
            {analysis.recommended_action}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center justify-between text-[11px] text-gray-500">
        <span>AI analysis provides recommendations; final action remains under human administrative authority.</span>
      </div>
    </div>
  );
};
