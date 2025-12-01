import React from "react";
import { useGroups } from "../../../../hooks/useGroups";
import Avatar from "../../Avatar";
import {
  Zap,
  Flame,
  Clock,
  Star,
  MapPin,
  Users,
  UserCheck,
  UserPlus,
  MessageCircle,
  Eye,
} from "lucide-react";

export const StudentCard = ({ student, variant = "full" }) => {
  const { joinGroup, loading: groupActionLoading } = useGroups();

  const handleConnect = async () => {
    // Aquí podrías implementar la lógica de conectar con un estudiante
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar
              userId={student.id || student.user_id || student.email || `student-${student.id}`}
              name={student.name || "Estudiante"}
              avatar={student.avatar_url || null}
              avatarStyle={student.avatar}
              size={56}
              showBorder={false}
            />
            {student.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {student.name}
            </h3>
            <p className="text-sm text-gray-600">{student.career}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500">
                {student.university}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">
                Semestre {student.semester}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <div className="text-right">
            <div className="flex items-center text-sm font-medium text-green-600">
              <Zap className="w-4 h-4 mr-1" />
              {student.compatibility}% match
            </div>
            <p className="text-xs text-gray-500">
              Última vez: {student.lastActive}
            </p>
          </div>
        </div>
      </div>

      {variant === "full" && (
        <p className="text-gray-700 text-sm mb-4 line-clamp-3">{student.bio}</p>
      )}

      <div className="grid grid-cols-1 gap-3 mb-4 text-center sm:grid-cols-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Flame className="w-4 h-4 text-orange-500 mr-1" />
            <span className="text-sm font-bold text-gray-900">
              {student.streak}
            </span>
          </div>
          <p className="text-xs text-gray-600">días racha</p>
        </div>
        <div className="p-2 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm font-bold text-gray-900">
              {student.studyHours}h
            </span>
          </div>
          <p className="text-xs text-gray-600">estudiadas</p>
        </div>
        <div className="p-2 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Star className="w-4 h-4 text-yellow-500 mr-1" />
            <span className="text-sm font-bold text-gray-900">
              {student.rating}
            </span>
          </div>
          <p className="text-xs text-gray-600">rating</p>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Materias en común:
        </h4>
        <div className="flex flex-wrap gap-1">
          {student.subjects?.slice(0, 3).map((subject, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {subject}
            </span>
          ))}
          {student.subjects?.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{student.subjects.length - 3} más
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <span className="flex items-center">
          <MapPin className="w-3 h-3 mr-1" />
          {student.location}
        </span>
        <span className="flex items-center">
          <Users className="w-3 h-3 mr-1" />
          {student.connections} conexiones
        </span>
        {student.mutualConnections > 0 && (
          <span className="flex items-center text-blue-600">
            <UserCheck className="w-3 h-3 mr-1" />
            {student.mutualConnections} conocidos
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleConnect}
          disabled={groupActionLoading}
          className="flex-1 min-w-[140px] bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <UserPlus className="w-4 h-4 inline mr-2" />
          {groupActionLoading ? "Conectando..." : "Conectar"}
        </button>
        <button className="flex-1 min-w-[60px] px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-gray-600" />
        </button>
        <button className="flex-1 min-w-[60px] px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center">
          <Eye className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

