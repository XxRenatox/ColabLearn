import React from "react";

export const StatSummaryCard = ({ title, value, subtitle, tone = 'from-cyan-500 to-sky-500' }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white/90 p-4 shadow-sm transition-transform duration-300 hover:-translate-y-1">
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${tone} opacity-10 blur-3xl`} />
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-gray-900">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
};

