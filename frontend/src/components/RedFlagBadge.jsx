import React from 'react';
import { AlertOctagon } from 'lucide-react';

export default function RedFlagBadge({ flags }) {
  if (!flags || flags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {flags.map((flag, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1.5 rounded-md bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700"
        >
          <AlertOctagon className="h-3.5 w-3.5 text-red-500" />
          {flag}
        </span>
      ))}
    </div>
  );
}
