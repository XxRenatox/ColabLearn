import React from "react";
import { ProgressBar } from "../../ProgressBar";
import { Trophy } from "lucide-react";

export const AchievementProgressCard = ({ 
  title = "Logros y recompensas",
  progress,
  unlocked,
  total,
  message = "Sigue participando para conseguir más",
  borderColor = "border-amber-100",
  gradientFrom = "from-amber-50",
  gradientVia = "via-white",
  gradientTo = "to-rose-50"
}) => {
  return (
    <div className={`rounded-3xl bg-white p-6 shadow-sm border ${borderColor} flex flex-col justify-between relative overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo} opacity-60`} />
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">
            {title}
          </h3>
          <ProgressBar progress={progress} />
          <p className="mt-3 text-sm text-slate-500">
            {unlocked} de {total} logros desbloqueados.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-2 text-amber-600 text-sm font-medium bg-amber-50 rounded-2xl px-3 py-2">
          <Trophy className="h-4 w-4" /> {message}
        </div>
      </div>
    </div>
  );
};

