import React from "react";

export const MetricCard = ({ 
  title, 
  value, 
  helper, 
  icon: Icon, 
  accent = "from-sky-500 to-indigo-500", 
  iconStyles = "", 
  valueColor = "text-slate-900" 
}) => {
  return (
    <div className="relative rounded-3xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-10 rounded-3xl`} />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {title}
          </p>
          <p className={`mt-2 text-2xl font-semibold ${valueColor}`}>
            {value}
          </p>
          {helper && <p className="text-sm text-slate-500">{helper}</p>}
        </div>
        {Icon && (
          <div className={`rounded-2xl p-3 ${iconStyles}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
};

