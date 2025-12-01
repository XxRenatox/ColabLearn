import React from "react";
import { CheckCircle } from "lucide-react";

export const AchievementCard = ({ achievement }) => {
  const Icon = achievement.icon;
  return (
    <div
      className={`bg-white rounded-xl border p-6 ${
        achievement.unlocked
          ? "border-yellow-200 bg-yellow-50"
          : "border-gray-100"
      }`}
    >
      <div className="flex items-center space-x-4">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            achievement.unlocked
              ? "bg-yellow-500 text-white"
              : "bg-gray-200 text-gray-400"
          }`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3
            className={`font-semibold ${
              achievement.unlocked ? "text-gray-900" : "text-gray-500"
            }`}
          >
            {achievement.name}
          </h3>
          <p className="text-sm text-gray-500">{achievement.description}</p>
        </div>
        {achievement.unlocked && (
          <CheckCircle className="w-6 h-6 text-green-500" />
        )}
      </div>
    </div>
  );
};

