import React from "react";
import { ProgressBar } from "../../ProgressBar";

export const ProgressCard = ({ 
  title, 
  progress, 
  description, 
  badge, 
  borderColor = "border-indigo-100",
  gradientFrom = "from-indigo-50",
  gradientVia = "via-white",
  gradientTo = "to-emerald-50",
  progressColor = "blue"
}) => {
  return (
    <div className={`rounded-3xl bg-white p-6 shadow-sm border ${borderColor} flex flex-col relative overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo} opacity-60`} />
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            {title}
          </h3>
          {badge && (
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
              {badge}
            </span>
          )}
        </div>
        <ProgressBar progress={progress} color={progressColor || "blue"} />
        {description && (
          <p className="mt-4 text-sm text-slate-600 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

