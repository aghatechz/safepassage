import React from 'react';
import { Server, Shield } from 'lucide-react';

export default function Footer({ hostname }) {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-slate-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          
          {/* Logo/Copyright */}
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-500" />
            <span className="text-sm font-semibold text-slate-700">
              SafePassage &copy; {new Date().getFullYear()}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">| Protecting job seekers worldwide</span>
          </div>

          {/* Load Balancer Server Hostname Badge */}
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs text-slate-500">
            <Server className="h-3.5 w-3.5 text-teal-600" />
            <span className="font-mono">
              Served by: <span className="font-semibold text-teal-700">{hostname || 'fetching...'}</span>
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
}
