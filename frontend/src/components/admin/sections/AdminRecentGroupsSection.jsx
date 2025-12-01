import React from 'react';
import { Search, MessageSquare } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { formatNumber, formatDateTime } from '@/utils/adminUtils';

export const AdminRecentGroupsSection = ({
  groupsState,
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onToggleStatus,
  onSelectGroup,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-gray-100 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Grupos más recientes</h3>
          <p className="text-sm text-gray-500">
            {formatNumber(groupsState.total)} grupos registrados en total.
          </p>
        </div>
      </div>
      
      {/* Filtros de grupos */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por asignatura..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="pending">Pendientes</option>
            <option value="archived">Archivados</option>
          </select>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {groupsState.list.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            No se encontraron grupos recientes.
          </div>
        ) : (
          groupsState.list.map((group) => (
            <div 
              key={group.id} 
              className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onSelectGroup(group)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-900">{group.name || 'Sin nombre'}</h4>
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">{group.subject || 'Sin asignatura'}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Creado {formatDateTime(group.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full border ${
                        group.status === 'active'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : group.status === 'inactive'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      {group.status === 'active' ? 'Activo' : group.status === 'inactive' ? 'Inactivo' : group.status || 'activo'}
                    </span>
                    <div className="text-xs text-gray-500 mt-2">
                      {formatNumber(group.member_count || 0)} miembros
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStatus(group);
                    }}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
                  >
                    {group.status === 'active' ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <Pagination
        currentPage={groupsState.pagination.page}
        totalPages={groupsState.pagination.pages}
        onPageChange={onPageChange}
        totalItems={groupsState.total}
        itemsPerPage={groupsState.pagination.limit}
      />
    </div>
  );
};

export default AdminRecentGroupsSection;

