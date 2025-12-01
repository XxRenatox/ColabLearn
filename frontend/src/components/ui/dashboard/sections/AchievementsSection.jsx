import React, { useState } from "react";
import { Trophy, Lock, Star, Clock, Users, BookOpen, Target, Award, Filter } from "lucide-react";
import { AchievementDetailCard } from "../../../ui/cards/achievements/AchievementDetailCard";

export default function Achievements({ achievements = [], totalAchievements, loading = false }) {
  const [filter, setFilter] = useState('all'); // all, unlocked, locked
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = [
    'all', 'study_hours', 'group_participation', 'session_completion', 
    'streak', 'collaboration', 'academic_excellence'
  ];

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'study_hours': return Clock;
      case 'group_participation': return Users;
      case 'session_completion': return BookOpen;
      case 'streak': return Target;
      case 'collaboration': return Users;
      case 'academic_excellence': return Award;
      default: return Trophy;
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      case 'common': return 'from-gray-400 to-gray-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'unlocked' && achievement.unlocked) ||
                         (filter === 'locked' && !achievement.unlocked);
    const matchesCategory = categoryFilter === 'all' || achievement.category === categoryFilter;
    return matchesFilter && matchesCategory;
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  // Usar totalAchievements si está disponible, sino usar achievements.length
  const totalCount = totalAchievements !== undefined ? totalAchievements : achievements.length;
  const completionPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Logros</h2>
          <p className="text-gray-600">
            {unlockedCount} de {totalCount} logros desbloqueados ({completionPercentage.toFixed(0)}%)
          </p>
        </div>
        
        <div className="bg-white p-3 rounded-xl border border-gray-100">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-medium text-gray-900">{unlockedCount}</span>
            <span className="text-gray-500">logros</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-6 rounded-xl border border-gray-100">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progreso general</span>
          <span>{completionPercentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="unlocked">Desbloqueados</option>
              <option value="locked">Bloqueados</option>
            </select>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las categorías</option>
              <option value="study_hours">Horas de estudio</option>
              <option value="group_participation">Participación en grupos</option>
              <option value="session_completion">Sesiones completadas</option>
              <option value="streak">Rachas</option>
              <option value="collaboration">Colaboración</option>
              <option value="academic_excellence">Excelencia académica</option>
            </select>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filteredAchievements.length > 0 ? (
          filteredAchievements.map((achievement) => (
            <AchievementDetailCard
              key={achievement.id}
              achievement={achievement}
              getCategoryIcon={getCategoryIcon}
              getRarityColor={getRarityColor}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'unlocked' ? 'No tienes logros desbloqueados aún' :
               filter === 'locked' ? 'No hay logros bloqueados' :
               'No se encontraron logros'}
            </h3>
            <p className="text-gray-500">
              {filter === 'unlocked' ? '¡Sigue estudiando para desbloquear tu primer logro!' :
               'Intenta con otros filtros para ver más logros'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
