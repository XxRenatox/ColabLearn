import React from "react";
import { Star, Check, X } from "lucide-react";
import { useGroups } from "../../../../hooks/useGroups";

export const RecomendationGroupCard = ({ group, onView }) => {
  const { joinGroup, loading: groupActionLoading } = useGroups();

  const handleJoinGroup = async () => {
    try {
      await joinGroup(group.id);
    } catch (error) {
      // Error joining group
    }
  };

  return (
    <div
      key={group.id}
      className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-transform duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-semibold text-gray-900">{group.name}</h3>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              {Math.round(group.compatibility_score)}% compatible
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{group.description}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>{group.university}</span>
            <span>{group.career}</span>
            <span>{group.subject}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">
            {group.member_count}/{group.max_members} miembros
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {group.average_rating?.toFixed(1) || "N/A"}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Compatibilidad</span>
          <span className="font-medium text-blue-600">
            {Math.round(group.compatibility_score)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${group.compatibility_score}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Universidad:</span>
          <span
            className={
              group.compatibility_factors?.university
                ? "text-green-600"
                : "text-red-600"
            }
          >
            {group.compatibility_factors?.university ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Carrera:</span>
          <span
            className={
              group.compatibility_factors?.career
                ? "text-green-600"
                : "text-red-600"
            }
          >
            {group.compatibility_factors?.career ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {onView && (
          <button
            onClick={onView}
            className="flex-1 min-w-[120px] bg-gray-50 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Ver detalles
          </button>
        )}
        <button
          onClick={handleJoinGroup}
          disabled={groupActionLoading}
          className="flex-1 min-w-[120px] bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {groupActionLoading ? "Uniendo..." : "Solicitar unirse"}
        </button>
      </div>
    </div>
  );
};

