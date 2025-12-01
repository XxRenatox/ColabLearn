import React from 'react';
import { Clock } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { formatNumber, formatDateTime, translateSessionStatus } from '@/utils/adminUtils';

export const AdminRecentSessionsSection = ({
  sessionsState,
  statusFilter,
  onStatusFilterChange,
  onPageChange,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-gray-100 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Próximas sesiones</h3>
          <p className="text-sm text-gray-500">
            {formatNumber(sessionsState.total)} sesiones registradas.
          </p>
        </div>
      </div>
      
      {/* Filtros de sesiones */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todos los estados</option>
          <option value="scheduled">Programadas</option>
          <option value="in_progress">En progreso</option>
          <option value="completed">Completadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>
      <div className="divide-y divide-gray-100">
        {sessionsState.list.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            No hay sesiones próximas registradas.
          </div>
        ) : (
          sessionsState.list.map((session) => (
            <div key={session.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {session.title || 'Sesión sin título'}
                    </h4>
                    <span className="text-xs text-gray-400">
                      {formatDateTime(session.scheduled_date)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Duración: {session.duration || 0} minutos
                  </p>
                  <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 mt-2">
                    Estado: {translateSessionStatus(session.status)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <Pagination
        currentPage={sessionsState.pagination.page}
        totalPages={sessionsState.pagination.pages}
        onPageChange={onPageChange}
        totalItems={sessionsState.total}
        itemsPerPage={sessionsState.pagination.limit}
      />
    </div>
  );
};

export default AdminRecentSessionsSection;

