import React from "react";
import { Lock, Trophy } from "lucide-react";

export const AchievementDetailCard = ({ achievement, getCategoryIcon, getRarityColor }) => {
  const Icon = getCategoryIcon ? getCategoryIcon(achievement.category) : Trophy;
  const rarityGradient = getRarityColor ? getRarityColor(achievement.rarity) : 'from-gray-400 to-gray-500';
  
  return (
    <div 
      className={`relative bg-white rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg ${
        achievement.unlocked 
          ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50' 
          : 'border-gray-200 opacity-75'
      }`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${rarityGradient} rounded-t-xl`}></div>
      
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          achievement.unlocked 
            ? `bg-gradient-to-r ${rarityGradient} text-white` 
            : 'bg-gray-100 text-gray-400'
        }`}>
          {achievement.unlocked ? <Icon className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
        </div>
        
        <div className="flex-1">
          <h3 className={`font-semibold mb-1 ${
            achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
          }`}>
            {achievement.name}
          </h3>
          <p className={`text-sm mb-3 ${
            achievement.unlocked ? 'text-gray-600' : 'text-gray-400'
          }`}>
            {achievement.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                achievement.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {achievement.rarity === 'legendary' ? 'Legendario' :
                 achievement.rarity === 'epic' ? 'Épico' :
                 achievement.rarity === 'rare' ? 'Raro' : 'Común'}
              </span>
              
              {achievement.xp_reward > 0 && (
                <span className="text-xs text-blue-600 font-medium">
                  +{achievement.xp_reward} XP
                </span>
              )}
            </div>
            
            {achievement.unlocked && achievement.unlockedAt && (
              <span className="text-xs text-gray-500">
                {new Date(achievement.unlockedAt).toLocaleDateString('es-ES')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

