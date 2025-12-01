import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Trash2,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  BarChart3,
  File,
  Globe,
  Lock,
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

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

const translateResourceType = (type) => {
  const types = {
    guide: 'Guía',
    document: 'Documento',
    link: 'Enlace',
    exercise: 'Ejercicio',
    material_theory: 'Material Teórico',
    video: 'Video',
    tool: 'Herramienta',
    other: 'Otro',
  };
  return types[type] || type || 'Otro';
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

export default function ResourcesManagement() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, pages: 0, total: 0 });
  const [search, setSearch] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('all');
  const [publicFilter, setPublicFilter] = useState('all');
  const [selectedResource, setSelectedResource] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchResources = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        limit: 20,
        page,
        ...(search && { search }),
        ...(resourceTypeFilter !== 'all' && { resource_type: resourceTypeFilter }),
        ...(publicFilter !== 'all' && { is_public: publicFilter === 'public' }),
      };
      const response = await adminAPI.getResources(params);
      const payload = response?.data || response;
      setResources(payload.resources || []);
      setPagination(payload.pagination || { page: 1, limit: 20, pages: 0, total: 0 });
    } catch (err) {
      toast.error('Error cargando recursos', err?.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getResourcesStats();
      const payload = response?.data || response;
      setStats(payload);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResources(1);
    }, search ? 500 : 0);
    return () => clearTimeout(timer);
  }, [search, resourceTypeFilter, publicFilter]);

  const handleDelete = async () => {
    if (!selectedResource) return;

    try {
      setDeleting(true);
      await adminAPI.deleteResource(selectedResource.id);
      toast.success('Recurso eliminado', 'El recurso ha sido eliminado exitosamente');
      setShowDeleteModal(false);
      setSelectedResource(null);
      fetchResources(pagination.page);
      fetchStats();
    } catch (err) {
      toast.error('Error eliminando recurso', err?.message);
    } finally {
      setDeleting(false);
    }
  };

  const statsCards = stats ? [
    {
      label: 'Total de recursos',
      value: formatNumber(stats.total),
      icon: FileText,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Recursos públicos',
      value: formatNumber(stats.public),
      icon: Globe,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      label: 'Recursos privados',
      value: formatNumber(stats.private),
      icon: Lock,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
    },
    {
      label: 'Total descargas',
      value: formatNumber(stats.totalDownloads),
      icon: Download,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Recursos</h2>
          <p className="text-gray-600 mt-1">Administra y modera todos los recursos del sistema</p>
        </div>
        <button
          onClick={() => {
            // TODO: Implementar exportación de recursos
            toast.info('Exportar recursos', 'La funcionalidad de exportación estará disponible próximamente');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors self-start sm:self-auto"
          title="Exportar recursos (próximamente)"
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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={resourceTypeFilter}
            onChange={(e) => setResourceTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los tipos</option>
            <option value="guide">Guía</option>
            <option value="document">Documento</option>
            <option value="link">Enlace</option>
            <option value="exercise">Ejercicio</option>
            <option value="material_theory">Material Teórico</option>
            <option value="video">Video</option>
            <option value="tool">Herramienta</option>
            <option value="other">Otro</option>
          </select>
          <select
            value={publicFilter}
            onChange={(e) => setPublicFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="public">Públicos</option>
            <option value="private">Privados</option>
          </select>
        </div>
      </div>

      {/* Lista de recursos */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recursos</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : resources.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No se encontraron recursos</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Recurso
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Visibilidad
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Descargas
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Subido por
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resources.map((resource) => (
                    <tr key={resource.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <File className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{resource.name || resource.original_name}</div>
                            <div className="text-xs text-gray-500">{formatFileSize(resource.size)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                          {translateResourceType(resource.resource_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {resource.is_public ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-50 text-green-700 border border-green-200">
                            <Globe className="w-3 h-3" />
                            Público
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                            <Lock className="w-3 h-3" />
                            Privado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatNumber(resource.downloads || resource.download_count || 0)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{resource.uploader?.name || 'Usuario desconocido'}</div>
                        {resource.group && (
                          <div className="text-xs text-gray-500">Grupo: {resource.group.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatDateTime(resource.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedResource(resource);
                            setShowDeleteModal(true);
                          }}
                          className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) => fetchResources(page)}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
            />
          </>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Eliminar recurso</h3>
              </div>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar el recurso <strong>{selectedResource.name || selectedResource.original_name}</strong>?
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedResource(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

