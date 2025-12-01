import React from "react";

export const GroupStatCard = ({ icon: Icon, label, value, iconBg = "bg-blue-50", iconColor = "text-blue-600" }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 border border-gray-100 hover:border-blue-100 hover:shadow-md transition">
      <div className={`p-3 rounded-lg ${iconBg} ${iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
};

