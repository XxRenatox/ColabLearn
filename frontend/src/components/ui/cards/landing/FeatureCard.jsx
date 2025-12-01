import React from "react";

export const FeatureCard = ({
  title,
  description,
  gradient = "from-blue-600 to-purple-600",
  icon: Icon,
}) => (
  <div className="group relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    <div className="relative z-10">
      <div
        className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r ${gradient} rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300`}
      >
        {Icon && <Icon className="w-7 h-7 text-white" />}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
        {title}
      </h3>
      <p className="text-gray-600 text-lg leading-relaxed">{description}</p>
    </div>
  </div>
);

export const StudentPanelCard = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  className = "",
}) => (
  <div
    className={`bg-white rounded-xl shadow-md p-6 flex items-center ${className}`}
  >
    {Icon && (
      <div className="flex-shrink-0 mr-4">
        <Icon className="w-10 h-10 text-blue-600" />
      </div>
    )}
    <div className="flex-1">
      <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
      {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
    </div>
    {actions && <div className="ml-4 flex space-x-2">{actions}</div>}
  </div>
);

