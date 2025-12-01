import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Bell,
  Users,
  BookOpen,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  FileDown,
} from 'lucide-react';
import { adminAPI } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { StatCard } from '@/components/ui/Card';

const formatNumber = (value) => {
  if (Number.isNaN(value) || value === undefined || value === null) {
    return '0';
  }
  return new Intl.NumberFormat('es-CL').format(value);
};

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const getEventIcon = (eventType) => {
  const iconMap = {
    notification: Bell,
    group_created: Users,
    session_completed: BookOpen,
    default: Activity,
  };
  return iconMap[eventType] || iconMap.default;
};

const getEventColor = (eventType) => {
  const colorMap = {
    notification: 'bg-blue-100 text-blue-600',
    group_created: 'bg-green-100 text-green-600',
    session_completed: 'bg-purple-100 text-purple-600',
    default: 'bg-gray-100 text-gray-600',
  };
  return colorMap[eventType] || colorMap.default;
};

const translateEventType = (type) => {
  const types = {
    notification: 'Notificación',
    group_created: 'Grupo Creado',
    session_completed: 'Sesión Completada',
    info: 'Información',
    success: 'Éxito',
    warning: 'Advertencia',
    error: 'Error',
  };
  return types[type] || type || 'Evento';
};

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 gap-4">
      <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
        Mostrando <span className="font-medium">{startItem}</span> a{' '}
        <span className="font-medium">{endItem}</span> de{' '}
        <span className="font-medium">{totalItems}</span> resultados
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <div className="flex items-center gap-1">
          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                1
              </button>
              {startPage > 2 && <span className="px-1 sm:px-2 text-gray-500 text-xs">...</span>}
            </>
          )}

          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md ${
                page === currentPage
                  ? 'bg-blue-600 text-white border border-blue-600'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-1 sm:px-2 text-gray-500 text-xs">...</span>}
              <button
                onClick={() => onPageChange(totalPages)}
                className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
};

export default function SystemLogs() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, pages: 0, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        limit: 50,
        page,
        ...(search && { search }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };
      const response = await adminAPI.getLogs(params);
      const payload = response?.data || response;
      setLogs(payload.logs || []);
      setPagination(payload.pagination || { page: 1, limit: 50, pages: 0, total: 0 });
    } catch (err) {
      toast.error('Error cargando logs', err?.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getLogsStats();
      const payload = response?.data || response;
      setStats(payload);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(currentPage);
    }, search ? 500 : 0);
    return () => clearTimeout(timer);
  }, [search, typeFilter, startDate, endDate, currentPage]);

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'type') {
      setTypeFilter(value);
    } else if (filterType === 'search') {
      setSearch(value);
    } else if (filterType === 'startDate') {
      setStartDate(value);
    } else if (filterType === 'endDate') {
      setEndDate(value);
    }
    setCurrentPage(1); // Reset a primera página al cambiar filtros
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const statsCards = stats ? [
    {
      label: 'Total de eventos',
      value: formatNumber(stats.total),
      icon: Activity,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Últimas 24 horas',
      value: formatNumber(stats.last24Hours),
      icon: Clock,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      label: 'Últimos 7 días',
      value: formatNumber(stats.last7Days),
      icon: Calendar,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Grupos creados (7d)',
      value: formatNumber(stats.groupsCreatedLast7d),
      icon: Users,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Logs del Sistema</h2>
          <p className="text-gray-600 mt-1">Monitorea la actividad y eventos del sistema</p>
        </div>
        <button
          onClick={() => {
            // TODO: Implementar exportación de logs
            toast.info('Exportar logs', 'La funcionalidad de exportación estará disponible próximamente');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors self-start sm:self-auto"
          title="Exportar logs (próximamente)"
        >
          <FileDown className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statsCards.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en logs (mensaje, usuario, detalles)..."
                value={search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los tipos</option>
              <option value="notification">Notificaciones</option>
              <option value="group_created">Grupos Creados</option>
              <option value="session_completed">Sesiones Completadas</option>
            </select>
            {(search || typeFilter !== 'all' || startDate || endDate) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Limpiar
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                max={endDate || undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                min={startDate || undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de logs */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Actividad del Sistema</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No se encontraron logs</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {logs.map((log) => {
                const Icon = getEventIcon(log.event_type);
                const iconColor = getEventColor(log.event_type);
                return (
                  <div key={log.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg ${iconColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${iconColor} border`}>
                            {translateEventType(log.event_type)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">{log.message}</p>
                        {log.details && (
                          <p className="text-sm text-gray-600 mb-2">{log.details}</p>
                        )}
                        {log.user && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            <span>{log.user.name || log.user.email || 'Usuario desconocido'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) => fetchLogs(page)}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
            />
          </>
        )}
      </div>
    </div>
  );
}

