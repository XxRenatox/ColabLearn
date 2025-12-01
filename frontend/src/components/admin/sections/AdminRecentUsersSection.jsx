import React from 'react';
import { Search } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { formatNumber, formatDateTime } from '@/utils/adminUtils';

export const AdminRecentUsersSection = ({
  usersState,
  search,
  statusFilter,
  roleFilter,
  onSearchChange,
  onStatusFilterChange,
  onRoleFilterChange,
  onPageChange,
  onToggleStatus,
}) => {
  return (
    <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-gray-100 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Usuarios recientes</h3>
          <p className="text-sm text-gray-500">
            Gestiona el estado y monitorea actividad reciente.
          </p>
        </div>
        <span className="px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-600 border border-blue-100 self-start sm:self-auto">
          {formatNumber(usersState.total)} usuarios
        </span>
      </div>

      {/* Filtros de búsqueda */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email, universidad..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => onRoleFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Administradores</option>
              <option value="student">Estudiantes</option>
              <option value="mentor">Mentores</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Última actividad
              </th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usersState.list.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{item.name || 'Sin nombre'}</span>
                    <span className="text-xs text-gray-500">{item.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-2 py-1 text-xs rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {item.role || 'student'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                      item.is_active
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-600 border border-red-200'
                    }`}
                  >
                    {item.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {formatDateTime(item.last_active || item.created_at)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onToggleStatus(item)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {item.is_active ? 'Desactivar' : 'Reactivar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={usersState.pagination.page}
        totalPages={usersState.pagination.pages}
        onPageChange={onPageChange}
        totalItems={usersState.total}
        itemsPerPage={usersState.pagination.limit}
      />
    </div>
  );
};

export default AdminRecentUsersSection;

