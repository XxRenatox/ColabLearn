import React from "react";

export const ProgressBar = ({ progress, color }) => {
  const progressPercentage = Math.min(Math.max(progress, 0), 100); // Ensure progress is between 0 and 100

  return (
    <div className="w-full bg-gray-200 rounded-full h-4">
      <div
        className={`bg-${color}-500 h-4 rounded-full transition-all duration-300}`}
        style={{ width: `${progressPercentage}%` }}
      ></div>
    </div>
  );
};

export const LevelProgressBar = ({ xp, level }) => {
  const totalXpForNextLevel = 3000; // Assuming each level requires 3000 XP
  const progressPercentage = (xp / totalXpForNextLevel) * 100;

  return (
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div
        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
        style={{ width: `${progressPercentage}%` }}
      ></div>
    </div>
  );
};

export const GroupProgressBar = ({ progress }) => {
  const progressPercentage = Math.min(Math.max(progress, 0), 100); // Ensure progress is between 0 and 100

  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progressPercentage}%` }}
      ></div>
    </div>
  );
}
