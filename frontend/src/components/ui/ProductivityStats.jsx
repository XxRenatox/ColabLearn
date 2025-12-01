import React from 'react';
import {
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Award,
  BarChart3
} from 'lucide-react';

const ProductivityStats = ({ className = "" }) => {
  // Componente deshabilitado - funcionalidad de timer de sesiones personales eliminada
  return null;

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
          Tu Productividad
        </h3>
        <div className="text-sm text-gray-500">
          Últimos 7 días
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center">
          <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-700">
            {stats.total_sessions}
          </div>
          <div className="text-xs text-blue-600">Sesiones Totales</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center">
          <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-700">
            {stats.total_hours}h
          </div>
          <div className="text-xs text-green-600">Horas Estudiadas</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg text-center">
          <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-700">
            {stats.daily_average}h
          </div>
          <div className="text-xs text-purple-600">Promedio Diario</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg text-center">
          <Award className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-yellow-700">
            {stats.study_sessions}
          </div>
          <div className="text-xs text-yellow-600">Sesiones de Estudio</div>
        </div>
      </div>

      {/* Gráfico de barras semanal */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          Actividad Semanal
        </h4>
        <div className="flex items-end space-x-2 h-20">
          {stats.last_7_days.map((day, index) => (
            <div key={day.date} className="flex-1 flex flex-col items-center">
              <div
                className="bg-blue-500 rounded-t w-full transition-all duration-300 hover:bg-blue-600"
                style={{
                  height: `${Math.max((day.minutes / 480) * 100, 5)}%` // 480 min = 8 horas
                }}
                title={`${day.date}: ${day.minutes} min, ${day.sessions} sesiones`}
              ></div>
              <div className="text-xs text-gray-500 mt-1 text-center">
                {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short' })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Consejos de productividad */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {stats.daily_average >= 2 ? (
            <div className="flex items-center text-green-700">
              <Award className="w-4 h-4 mr-2" />
              ¡Excelente consistencia! Sigue así.
            </div>
          ) : stats.total_sessions > 10 ? (
            <div className="flex items-center text-blue-700">
              <TrendingUp className="w-4 h-4 mr-2" />
              Buen progreso. Intenta mantener sesiones diarias.
            </div>
          ) : (
            <div className="flex items-center text-orange-700">
              <Target className="w-4 h-4 mr-2" />
              ¡Comienza tu jornada de estudio! Cada sesión cuenta.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductivityStats;
