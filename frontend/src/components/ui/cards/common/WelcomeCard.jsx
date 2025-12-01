import React from "react";

export const WelcomeCard = ({ 
  name, 
  message, 
  badges = [],
  gradientFrom = "from-indigo-50",
  gradientVia = "via-white",
  gradientTo = "to-sky-100"
}) => {
  return (
    <section className="relative rounded-3xl bg-white/80 backdrop-blur-md p-8 shadow-md border border-gray-100 overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo} opacity-70`} />
      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-indigo-100 blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-sky-100 blur-2xl" />
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold text-slate-900">
            {name}
          </h1>
        </div>
        {message && (
          <p className="text-sm text-slate-500">
            {message}
          </p>
        )}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-600">
            {badges.map((badge, index) => (
              <span key={index} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                {badge.icon && <badge.icon className="h-4 w-4 text-indigo-500" />}
                {badge.text}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

