import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  BarChart3,
  Globe,
  Lock,
  Lock as LockIcon,
  MessageCircle,
  ThumbsUp,
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

export default function ForumsManagement() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [forums, setForums] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, pages: 0, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [publicFilter, setPublicFilter] = useState('all');
  const [selectedForum, setSelectedForum] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPostsModal, setShowPostsModal] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsPagination, setPostsPagination] = useState({ page: 1, limit: 20, pages: 0, total: 0 });
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteType, setDeleteType] = useState('forum'); // 'forum', 'post', 'reply'

  const fetchForums = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        limit: 20,
        page,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(publicFilter !== 'all' && { is_public: publicFilter === 'public' }),
      };
      const response = await adminAPI.getForums(params);
      const payload = response?.data || response;
      setForums(payload.forums || []);
      setPagination(payload.pagination || { page: 1, limit: 20, pages: 0, total: 0 });
    } catch (err) {
      toast.error('Error cargando foros', err?.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getForumsStats();
      const payload = response?.data || response;
      setStats(payload);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  };

  const fetchPosts = async (forumId, page = 1) => {
    try {
      setLoadingPosts(true);
      const response = await adminAPI.getForumPosts(forumId, { limit: 20, page });
      const payload = response?.data || response;
      setPosts(payload.posts || []);
      setPostsPagination(payload.pagination || { page: 1, limit: 20, pages: 0, total: 0 });
    } catch (err) {
      toast.error('Error cargando posts', err?.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchForums();
    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchForums(1);
    }, search ? 500 : 0);
    return () => clearTimeout(timer);
  }, [search, statusFilter, publicFilter]);

  useEffect(() => {
    if (selectedForum && showPostsModal) {
      fetchPosts(selectedForum.id);
    }
  }, [selectedForum, showPostsModal]);

  const handleDelete = async () => {
    if (!selectedForum && !selectedPost) return;

    try {
      setDeleting(true);
      if (deleteType === 'forum' && selectedForum) {
        await adminAPI.deleteForum(selectedForum.id);
        toast.success('Foro eliminado', 'El foro ha sido eliminado exitosamente');
      } else if (deleteType === 'post' && selectedPost) {
        await adminAPI.deleteForumPost(selectedPost.id);
        toast.success('Post eliminado', 'El post ha sido eliminado exitosamente');
        if (selectedForum) {
          fetchPosts(selectedForum.id, postsPagination.page);
        }
      }
      setShowDeleteModal(false);
      setSelectedForum(null);
      setSelectedPost(null);
      fetchForums(pagination.page);
      fetchStats();
    } catch (err) {
      toast.error('Error eliminando', err?.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleViewPosts = (forum) => {
    setSelectedForum(forum);
    setShowPostsModal(true);
  };

  const statsCards = stats ? [
    {
      label: 'Total de foros',
      value: formatNumber(stats.total),
      icon: MessageSquare,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Foros activos',
      value: formatNumber(stats.active),
      icon: BarChart3,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      label: 'Total de posts',
      value: formatNumber(stats.totalPosts),
      icon: MessageCircle,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Total de respuestas',
      value: formatNumber(stats.totalReplies),
      icon: ThumbsUp,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Foros</h2>
          <p className="text-gray-600 mt-1">Administra y modera todos los foros y contenido del sistema</p>
        </div>
        <button
          onClick={() => {
            // TODO: Implementar exportación de foros
            toast.info('Exportar foros', 'La funcionalidad de exportación estará disponible próximamente');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors self-start sm:self-auto"
          title="Exportar foros (próximamente)"
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
              placeholder="Buscar por título o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="active">Activos</option>
            <option value="deleted">Eliminados</option>
            <option value="locked">Bloqueados</option>
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

      {/* Lista de foros */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Foros</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : forums.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No se encontraron foros</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Foro
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Visibilidad
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Posts
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Creado por
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Última actividad
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {forums.map((forum) => (
                    <tr key={forum.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{forum.title}</div>
                            {forum.description && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">{forum.description}</div>
                            )}
                            {forum.group && (
                              <div className="text-xs text-gray-400">Grupo: {forum.group.name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {forum.is_public ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-50 text-green-700 border border-green-200 w-fit">
                              <Globe className="w-3 h-3" />
                              Público
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-50 text-gray-700 border border-gray-200 w-fit">
                              <Lock className="w-3 h-3" />
                              Privado
                            </span>
                          )}
                          {forum.is_locked && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 w-fit">
                              <LockIcon className="w-3 h-3" />
                              Bloqueado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatNumber(forum.post_count || 0)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{forum.creator?.name || 'Usuario desconocido'}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatDateTime(forum.last_activity || forum.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewPosts(forum)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Ver posts
                          </button>
                          <button
                            onClick={() => {
                              setSelectedForum(forum);
                              setDeleteType('forum');
                              setShowDeleteModal(true);
                            }}
                            className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) => fetchForums(page)}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
            />
          </>
        )}
      </div>

      {/* Modal de posts */}
      {showPostsModal && selectedForum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Posts del foro: {selectedForum.title}</h3>
                <p className="text-sm text-gray-500">{postsPagination.total} posts en total</p>
              </div>
              <button
                onClick={() => {
                  setShowPostsModal(false);
                  setSelectedForum(null);
                  setPosts([]);
                }}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingPosts ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No hay posts en este foro</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{post.title}</h4>
                            {post.is_pinned && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                                Fijado
                              </span>
                            )}
                            {post.is_deleted && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                                Eliminado
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Por: {post.author?.name || 'Usuario desconocido'}</span>
                            <span>{formatDateTime(post.created_at)}</span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" />
                              {formatNumber(post.likes || 0)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {formatNumber(post.views || 0)}
                            </span>
                            <span>{formatNumber(post.reply_count || 0)} respuestas</span>
                          </div>
                        </div>
                        {!post.is_deleted && (
                          <button
                            onClick={() => {
                              setSelectedPost(post);
                              setDeleteType('post');
                              setShowDeleteModal(true);
                            }}
                            className="ml-4 text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {postsPagination.pages > 1 && (
              <div className="border-t p-4">
                <Pagination
                  currentPage={postsPagination.page}
                  totalPages={postsPagination.pages}
                  onPageChange={(page) => fetchPosts(selectedForum.id, page)}
                  totalItems={postsPagination.total}
                  itemsPerPage={postsPagination.limit}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (selectedForum || selectedPost) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Eliminar {deleteType === 'forum' ? 'foro' : 'post'}
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar{' '}
                {deleteType === 'forum' ? (
                  <>
                    el foro <strong>{selectedForum?.title}</strong>?
                  </>
                ) : (
                  <>
                    el post <strong>{selectedPost?.title}</strong>?
                  </>
                )}
                {deleteType === 'forum' && ' Todos los posts y respuestas también serán eliminados.'} Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedForum(null);
                    setSelectedPost(null);
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

