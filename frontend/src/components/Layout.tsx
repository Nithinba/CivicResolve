import React from 'react';
import { Navbar } from './Navbar';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-200">CivicResolve Platform</span>
            <span>•</span>
            <span>Intelligent Municipal Grievance Ecosystem</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Powered by Google Gemini 2.0 Flash</span>
            <span>•</span>
            <span className="text-slate-500">Official Hackathon Prototype</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
