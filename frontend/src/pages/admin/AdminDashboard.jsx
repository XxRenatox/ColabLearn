import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Menu,
  FileDown,
} from 'lucide-react';
import { adminAPI } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { useApp } from '@/contexts/AppContext';
import ResourcesManagement from '@/components/admin/ResourcesManagement';
import ForumsManagement from '@/components/admin/ForumsManagement';
import SystemLogs from '@/components/admin/SystemLogs';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import AdminDashboardStats from '@/components/admin/sections/AdminDashboardStats';
import AdminRecentUsersSection from '@/components/admin/sections/AdminRecentUsersSection';
import AdminActivityFeed from '@/components/admin/sections/AdminActivityFeed';
import AdminRecentGroupsSection from '@/components/admin/sections/AdminRecentGroupsSection';
import AdminRecentSessionsSection from '@/components/admin/sections/AdminRecentSessionsSection';
import AdminUsersSection from '@/components/admin/sections/AdminUsersSection';
import AdminGroupsSection from '@/components/admin/sections/AdminGroupsSection';
import AdminSessionsSection from '@/components/admin/sections/AdminSessionsSection';
import AdminGroupDetailModal from '@/components/admin/modals/AdminGroupDetailModal';

export default function AdminDashboard() {
  const { user } = useApp();
  const toast = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [usersState, setUsersState] = useState({
    list: [],
    total: 0,
    pagination: { page: 1, limit: 8, pages: 0 },
  });
  const [groupsState, setGroupsState] = useState({
    list: [],
    total: 0,
    pagination: { page: 1, limit: 6, pages: 0 },
  });
  const [sessionsState, setSessionsState] = useState({
    list: [],
    total: 0,
    pagination: { page: 1, limit: 6, pages: 0 },
  });
  const [activityState, setActivityState] = useState({
    list: [],
    total: 0,
    pagination: { page: 1, limit: 10, pages: 0 },
  });
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' o 'members'
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [groupSearch, setGroupSearch] = useState('');
  const [groupStatusFilter, setGroupStatusFilter] = useState('all');
  const [sessionStatusFilter, setSessionStatusFilter] = useState('all');
  
  // Determinar sección activa basada en hash de URL
  const [activeSection, setActiveSection] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'dashboard';
  });

  // Sincronizar activeSection con hash de URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setActiveSection(hash || 'dashboard');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const fetchDashboard = async () => {
    try {
      setError(null);
      const response = await adminAPI.getDashboard();
      const payload = response?.data || response;
      setDashboardData(payload?.data || payload);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Error desconocido';
      const errorStatus = err?.response?.status || err?.status || 500;
      
      // Solo mostrar error crítico si es 401 o 403 (problemas de autenticación/autorización)
      if (errorStatus === 401 || errorStatus === 403) {
        setError(`Error de autenticación: ${errorMessage}`);
        toast.error('Error de permisos', 'No tienes permisos para acceder al panel de administración');
      } else {
        // Para otros errores, mostrar mensaje pero permitir que otras secciones se carguen
        setError(`Error al cargar resumen: ${errorMessage}. Las demás secciones pueden seguir funcionando.`);
        toast.warning('Error parcial', 'No se pudo cargar el resumen, pero puedes usar las demás secciones');
      }
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      const params = {
        limit: 8,
        page,
        ...(userSearch && { search: userSearch }),
        ...(userStatusFilter !== 'all' && { status: userStatusFilter }),
        ...(userRoleFilter !== 'all' && { role: userRoleFilter }),
      };
      const response = await adminAPI.getUsers(params);
      const payload = response?.data || response;
      setUsersState({
        list: payload.users || [],
        total: payload.total || 0,
        pagination: payload.pagination || { page: 1, limit: 8, pages: 0 },
      });
    } catch (err) {
      toast.error('No se pudieron cargar los usuarios', err?.message);
    }
  };

  const fetchGroups = async (page = 1) => {
    try {
      const params = {
        limit: 6,
        page,
        ...(groupStatusFilter !== 'all' && { status: groupStatusFilter }),
        ...(groupSearch && { subject: groupSearch }),
      };
      const response = await adminAPI.getGroups(params);
      const payload = response?.data || response;
      console.log('Groups data received:', payload);
      setGroupsState({
        list: payload.groups || [],
        total: payload.total || 0,
        pagination: payload.pagination || { page: 1, limit: 6, pages: 0 },
      });
    } catch (err) {
      console.error('Error fetching groups:', err);
      toast.error('No se pudieron cargar los grupos', err?.message);
    }
  };

  const fetchSessions = async (page = 1) => {
    try {
      const params = {
        limit: 6,
        page,
        order: 'asc',
        orderBy: 'scheduled_date',
        ...(sessionStatusFilter !== 'all' && { status: sessionStatusFilter }),
      };
      const response = await adminAPI.getSessions(params);
      const payload = response?.data || response;
      console.log('Sessions data received:', payload);
      setSessionsState({
        list: payload.sessions || [],
        total: payload.total || 0,
        pagination: payload.pagination || { page: 1, limit: 6, pages: 0 },
      });
    } catch (err) {
      console.error('Error fetching sessions:', err);
      toast.error('No se pudieron cargar las sesiones', err?.message);
    }
  };

  const fetchActivity = async (page = 1) => {
    try {
      // Usar el endpoint de notificaciones para obtener actividad
      const response = await adminAPI.getNotifications({ limit: 10, page });
      const payload = response?.data || response;
      setActivityState({
        list: payload.notifications || [],
        total: payload.total || 0,
        pagination: payload.pagination || { page: 1, limit: 10, pages: 0 },
      });
    } catch (err) {
      // Si falla, usar los datos del dashboard
      if (dashboardData?.latestActivity) {
        const activity = dashboardData.latestActivity;
        const limit = 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        setActivityState({
          list: activity.slice(startIndex, endIndex),
          total: activity.length,
          pagination: {
            page,
            limit,
            pages: Math.ceil(activity.length / limit),
          },
        });
      }
    }
  };

  const fetchGroupMembers = async (groupId) => {
    if (!groupId) return;
    try {
      setLoadingMembers(true);
      const response = await adminAPI.getGroupMembers(groupId);
      const payload = response?.data || response;
      setGroupMembers(payload.members || []);
    } catch (err) {
      toast.error('Error al cargar miembros', err?.message);
      setGroupMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (selectedGroup && activeTab === 'members') {
      fetchGroupMembers(selectedGroup.id);
    }
  }, [selectedGroup, activeTab]);

  const refreshAll = async () => {
    // Prevenir múltiples llamadas simultáneas
    if (isRefreshing) {
      return;
    }

    try {
      setIsRefreshing(true);
      await Promise.all([
        fetchDashboard(),
        fetchUsers(usersState.pagination.page),
        fetchGroups(groupsState.pagination.page),
        fetchSessions(sessionsState.pagination.page),
        fetchActivity(activityState.pagination.page),
      ]);
      toast.success('Panel actualizado', 'Los datos se refrescaron correctamente');
    } catch (error) {
      console.error('Error actualizando datos:', error);
      toast.error('Error actualizando datos', 'Revisa tu conexión e inténtalo nuevamente');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Cargar todas las secciones en paralelo, pero no fallar si alguna falla
        await Promise.allSettled([
          fetchDashboard(),
          fetchUsers(),
          fetchGroups(),
          fetchSessions(),
          fetchActivity(),
        ]);
      } catch (err) {
        console.error('Error loading admin panel:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Refrescar cuando cambien los filtros (con debounce para búsqueda)
  useEffect(() => {
    // No hacer nada si aún está cargando inicialmente
    if (loading) {
      return;
    }

    const timer = setTimeout(() => {
      fetchUsers(1);
    }, userSearch ? 500 : 0);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearch, userStatusFilter, userRoleFilter]);

  useEffect(() => {
    // No hacer nada si aún está cargando inicialmente
    if (loading) {
      return;
    }

    const timer = setTimeout(() => {
      fetchGroups(1);
    }, groupSearch ? 500 : 0);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupSearch, groupStatusFilter]);

  useEffect(() => {
    // No hacer nada si aún está cargando inicialmente
    if (loading) {
      return;
    }

    fetchSessions(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatusFilter]);

  // Cargar actividad cuando cambie dashboardData (solo una vez al inicio)
  useEffect(() => {
    if (dashboardData?.latestActivity && activityState.list.length === 0) {
      fetchActivity(1);
    }
  }, [dashboardData]);

  const handleToggleGroupStatus = async (group) => {
    const currentStatus = group.status || 'active';
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      await adminAPI.updateGroupStatus(group.id, nextStatus);
      
      // Actualizar el grupo en la lista local
      setGroupsState((prev) => ({
        ...prev,
        list: prev.list.map((g) =>
          g.id === group.id ? { ...g, status: nextStatus } : g
        ),
      }));

      // Actualizar el resumen general si el grupo cambió de activo a inactivo o viceversa
      if (currentStatus === 'active' && nextStatus === 'inactive') {
        // Grupo desactivado: disminuir grupos activos
        setDashboardData((prev) => {
          if (!prev?.summaries?.groups) return prev;
          const groupsSummary = prev.summaries.groups;
          return {
            ...prev,
            summaries: {
              ...prev.summaries,
              groups: {
                ...groupsSummary,
                active: Math.max(0, (groupsSummary.active || 0) - 1),
              },
            },
          };
        });
      } else if (currentStatus === 'inactive' && nextStatus === 'active') {
        // Grupo activado: aumentar grupos activos
        setDashboardData((prev) => {
          if (!prev?.summaries?.groups) return prev;
          const groupsSummary = prev.summaries.groups;
          return {
            ...prev,
            summaries: {
              ...prev.summaries,
              groups: {
                ...groupsSummary,
                active: (groupsSummary.active || 0) + 1,
              },
            },
          };
        });
      }

      toast.success(
        `Grupo ${nextStatus === 'active' ? 'activado' : 'desactivado'}`,
        `El grupo "${group.name}" ha sido ${nextStatus === 'active' ? 'activado' : 'desactivado'} exitosamente`
      );
    } catch (err) {
      console.error('Error updating group status:', err);
      toast.error(
        'Error actualizando grupo',
        err?.response?.data?.message || err?.message || 'No se pudo actualizar el estado del grupo'
      );
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    try {
      const currentStatus = targetUser.is_active;
      const nextStatus = !currentStatus;
      
      // No hacer nada si el estado no cambió realmente
      if (currentStatus === nextStatus) {
        return;
      }

      const response = await adminAPI.updateUserStatus(targetUser.id, nextStatus);
      
      // Verificar respuesta exitosa
      if (response?.success !== false) {
        toast.success(
          `Usuario ${nextStatus ? 'activado' : 'desactivado'}`,
          `${targetUser.name || targetUser.email} fue actualizado correctamente`,
        );

        // Actualizar estado local de usuarios
        setUsersState((prev) => ({
          ...prev,
          list: prev.list.map((item) =>
            item.id === targetUser.id ? { ...item, is_active: nextStatus } : item,
          ),
        }));

        // Actualizar resumen del dashboard
        setDashboardData((prev) => {
          if (!prev?.summaries?.users) {
            console.warn('No summaries.users available, skipping update');
            return prev;
          }

          const { users: userSummary, ...restSummaries } = prev.summaries;
          
          // Obtener valores actuales como números, asegurando que sean válidos
          const currentActive = Number(userSummary.active) || 0;
          const currentInactive = Number(userSummary.inactive) || 0;
          
          // Calcular nuevos valores basados en el cambio de estado
          const updatedSummary = {
            ...userSummary,
            active: nextStatus 
              ? currentActive + 1  // Si se activa, aumentar activos
              : Math.max(0, currentActive - 1), // Si se desactiva, disminuir activos (no menor a 0)
            inactive: nextStatus 
              ? Math.max(0, currentInactive - 1) // Si se activa, disminuir inactivos (no menor a 0)
              : currentInactive + 1, // Si se desactiva, aumentar inactivos
          };

          console.log('Updating dashboard summaries:', {
            previous: { active: currentActive, inactive: currentInactive },
            nextStatus,
            updated: { active: updatedSummary.active, inactive: updatedSummary.inactive },
          });

          return {
            ...prev,
            summaries: {
              ...restSummaries,
              users: updatedSummary,
            },
          };
        });
      } else {
        throw new Error(response?.message || 'Error al actualizar usuario');
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      toast.error(
        'No se pudo actualizar el usuario',
        err?.response?.data?.message || err?.message || 'Error desconocido'
      );
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-600">Cargando panel de administración...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {activeSection === 'dashboard' && 'Dashboard'}
                  {activeSection === 'users' && 'Gestión de Usuarios'}
                  {activeSection === 'groups' && 'Gestión de Grupos'}
                  {activeSection === 'sessions' && 'Gestión de Sesiones'}
                  {activeSection === 'resources' && 'Recursos'}
                  {activeSection === 'forums' && 'Foros'}
                  {activeSection === 'logs' && 'Logs del Sistema'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {activeSection === 'dashboard' && 'Resumen general de la plataforma'}
                  {activeSection === 'users' && 'Administra usuarios y permisos'}
                  {activeSection === 'groups' && 'Gestiona grupos de estudio'}
                  {activeSection === 'sessions' && 'Monitorea sesiones programadas'}
                  {activeSection === 'resources' && 'Gestiona recursos educativos'}
                  {activeSection === 'forums' && 'Administra foros y discusiones'}
                  {activeSection === 'logs' && 'Registro de actividad del sistema'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // TODO: Implementar exportación de datos
                  toast.info('Exportar datos', 'La funcionalidad de exportación estará disponible próximamente');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                title="Exportar datos (próximamente)"
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
              <button
                onClick={refreshAll}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                <ArrowUpRight className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Actualizando...' : 'Refrescar'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8">
            {activeSection === 'resources' && <ResourcesManagement />}
            {activeSection === 'forums' && <ForumsManagement />}
            {activeSection === 'logs' && <SystemLogs />}
            
            {/* Dashboard Section */}
            {activeSection === 'dashboard' && (
              <>
                {error && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-yellow-800 mb-1">Aviso</h3>
                        <p className="text-yellow-700">{error}</p>
                        <button
                          onClick={() => {
                            setError(null);
                            fetchDashboard();
                          }}
                          className="mt-2 text-yellow-800 underline hover:text-yellow-900 text-xs"
                        >
                          Reintentar carga del resumen
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <AdminDashboardStats dashboardData={dashboardData} />

                {/* Users & Activity - Solo en Dashboard */}
                <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <AdminRecentUsersSection
                    usersState={usersState}
                    search={userSearch}
                    statusFilter={userStatusFilter}
                    roleFilter={userRoleFilter}
                    onSearchChange={setUserSearch}
                    onStatusFilterChange={setUserStatusFilter}
                    onRoleFilterChange={setUserRoleFilter}
                    onPageChange={(page) => fetchUsers(page)}
                    onToggleStatus={handleToggleUserStatus}
                  />

                  <AdminActivityFeed
                    activity={{
                      list: activityState.list,
                      latestActivity: dashboardData?.latestActivity,
                    }}
                    pagination={activityState.pagination}
                    onPageChange={(page) => fetchActivity(page)}
                  />
                </section>

                {/* Groups and Sessions */}
                <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <AdminRecentGroupsSection
                    groupsState={groupsState}
                    search={groupSearch}
                    statusFilter={groupStatusFilter}
                    onSearchChange={setGroupSearch}
                    onStatusFilterChange={setGroupStatusFilter}
                    onPageChange={(page) => fetchGroups(page)}
                    onToggleStatus={handleToggleGroupStatus}
                    onSelectGroup={setSelectedGroup}
                  />

                  <AdminRecentSessionsSection
                    sessionsState={sessionsState}
                    statusFilter={sessionStatusFilter}
                    onStatusFilterChange={setSessionStatusFilter}
                    onPageChange={(page) => fetchSessions(page)}
                  />
                </section>
              </>
            )}

            {/* Users Section */}
            {activeSection === 'users' && (
              <AdminUsersSection
                usersState={usersState}
                search={userSearch}
                statusFilter={userStatusFilter}
                roleFilter={userRoleFilter}
                onSearchChange={setUserSearch}
                onStatusFilterChange={setUserStatusFilter}
                onRoleFilterChange={setUserRoleFilter}
                onPageChange={(page) => fetchUsers(page)}
                onToggleStatus={handleToggleUserStatus}
              />
            )}

            {/* Groups Section */}
            {activeSection === 'groups' && (
              <AdminGroupsSection
                groupsState={groupsState}
                search={groupSearch}
                statusFilter={groupStatusFilter}
                onSearchChange={setGroupSearch}
                onStatusFilterChange={setGroupStatusFilter}
                onPageChange={(page) => fetchGroups(page)}
                onToggleStatus={handleToggleGroupStatus}
                onSelectGroup={setSelectedGroup}
              />
            )}

            {/* Sessions Section */}
            {activeSection === 'sessions' && (
              <AdminSessionsSection
                sessionsState={sessionsState}
                statusFilter={sessionStatusFilter}
                onStatusFilterChange={setSessionStatusFilter}
                onPageChange={(page) => fetchSessions(page)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modal de Chat y Miembros del Grupo */}
      {selectedGroup && activeSection === 'groups' && (
        <AdminGroupDetailModal
          group={selectedGroup}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          members={groupMembers}
          loadingMembers={loadingMembers}
          onClose={() => {
            setSelectedGroup(null);
            setActiveTab('chat');
            setGroupMembers([]);
          }}
        />
      )}
    </div>
  );
}

