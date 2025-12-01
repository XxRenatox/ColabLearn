import { useState, useEffect } from "react";

export const LandingCard = ({ children, className = "", delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`
      bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 transition-all duration-700 transform border border-white/20
      ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
      hover:shadow-2xl hover:-translate-y-2 hover:scale-105 group relative overflow-hidden
      ${className}
    `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

