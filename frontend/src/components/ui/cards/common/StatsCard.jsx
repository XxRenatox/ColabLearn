import React from "react";

export const StatsCard = ({ 
  icon: Icon, 
  value, 
  label, 
  iconGradient = "from-yellow-400 to-orange-400",
  delay = 0,
  isVisible = true
}) => {
  return (
    <div
      className={`text-center transform transition-all duration-1000 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 hover:bg-white/20 transition-all duration-300 border border-white/20">
        {Icon && (
          <div className={`bg-gradient-to-r ${iconGradient} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        )}
        <div className="text-4xl font-bold mb-2">
          {value}
        </div>
        <p className="text-lg opacity-90">{label}</p>
      </div>
    </div>
  );
};

