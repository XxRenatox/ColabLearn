import React from "react";

export const GroupDetailStatCard = ({ 
  icon: Icon, 
  value, 
  label, 
  gradientFrom = "from-blue-50", 
  gradientTo = "to-blue-100",
  iconColor = "text-blue-600",
  valueColor = "text-blue-900"
}) => {
  return (
    <div className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} p-3 rounded-lg`}>
      <div className="flex items-center justify-between">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <span className={`text-2xl font-bold ${valueColor}`}>{value}</span>
      </div>
      <p className={`text-xs ${valueColor.replace('900', '700')} mt-1`}>{label}</p>
    </div>
  );
};

