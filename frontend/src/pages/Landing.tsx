import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Sparkles,
  Search,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Landing: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white p-8 sm:p-14 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-400/30 px-3.5 py-1.5 rounded-full text-blue-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
            <span>AI-Driven Municipal Triage • Powered by Google Gemini</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Report Civic Issues. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
              Get Transparent Results.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            CivicResolve bridges citizens and municipal administration using intelligent AI.
            Submit photos of potholes, waste overflows, water leaks, or broken streetlights.
            Gemini automatically diagnoses the hazard, detects priority, recommends departments, and guarantees tracking.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            {isAuthenticated ? (
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className="px-6 py-3.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center transition-all"
              >
                Go to {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-6 py-3.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center transition-all"
                >
                  Report a Civic Issue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <Link
                  to="/track"
                  className="px-6 py-3.5 rounded-xl font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 backdrop-blur-md flex items-center transition-all"
                >
                  <Search className="w-4 h-4 mr-2 text-blue-400" />
                  Track Existing Complaint
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Decorative background grid pattern */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Core Workflow Process */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            How CivicResolve Works
          </h2>
          <p className="text-sm text-slate-600">
            A transparent 4-stage pipeline from community report to official municipal closure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg mb-4">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Citizen Lodging</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload photos, add description, and select GPS or manual location within seconds.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg mb-4">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Gemini AI Analysis</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gemini evaluates danger, computes severity (1-10), sets priority, and assigns the correct department.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-lg mb-4">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Admin Dispatch</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              City officials receive prioritized queues, review AI reasoning, and dispatch maintenance crews.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-black text-lg mb-4">
              4
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Resolution & Audit</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transparent resolution notes and timestamps logged to history, accessible publicly via Complaint ID.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            Engineered for High-Impact Civic Tech
          </h2>
          <p className="text-xs text-slate-500">
            Advanced features designed to replace manual bureaucracy with intelligent automation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Intelligent Gemini Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Understands nuanced natural language complaints without brittle keyword matching. Detects public safety risks like live wires, collapsing structures, or contaminated water.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Duplicate Report Detection</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Proactively cross-checks newly submitted complaints against existing neighborhood reports so municipal crews are not overwhelmed by duplicate dispatch tickets.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl w-fit">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Civic Intelligence Analytics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time department KPIs, resolution durations, priority breakdown, and issue hotspots generated directly from database transactions.
            </p>
          </div>
        </div>
      </section>

      {/* Public Quick Tracker Callout */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Have a Complaint Tracking ID?</h2>
          <p className="text-sm text-blue-100 max-w-lg">
            Check the official status, department routing, and resolution remarks of any reported civic issue anytime without logging in.
          </p>
        </div>
        <Link
          to="/track"
          className="px-6 py-3 rounded-xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition-colors shadow-md whitespace-nowrap"
        >
          Track Issue Now
        </Link>
      </section>
    </div>
  );
};
