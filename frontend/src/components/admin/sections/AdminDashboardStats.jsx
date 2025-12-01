import React, { useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Layers,
  Calendar,
  FileText,
  Bell,
  PieChart,
  BarChart3,
  FileDown,
} from 'lucide-react';
import { StatCard } from '@/components/ui/Card';
import { formatNumber } from '@/utils/adminUtils';
import { useToast } from '@/components/ui/Toast';

export const AdminDashboardStats = ({ dashboardData, onExport }) => {
  const toast = useToast();

  const stats = useMemo(() => {
    const summaries = dashboardData?.summaries;
    
    if (!summaries) {
      return [];
    }

    const usersTotal = summaries.users?.total ?? 0;
    const usersActive = summaries.users?.active ?? 0;
    const usersInactive = summaries.users?.inactive ?? 0;
    const usersNewLast7Days = summaries.users?.newLast7Days ?? 0;
    const groupsActive = summaries.groups?.active ?? 0;
    const sessionsUpcoming = summaries.sessions?.upcoming ?? 0;
    const resourcesTotal = summaries.resources?.total ?? 0;
    const forumsTotal = summaries.forums?.total ?? 0;

    return [
      {
        label: 'Usuarios totales',
        value: formatNumber(usersTotal),
        icon: Users,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        label: 'Activos',
        value: formatNumber(usersActive),
        icon: UserCheck,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
      },
      {
        label: 'Inactivos',
        value: formatNumber(usersInactive),
        icon: UserX,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
      },
      {
        label: 'Nuevos (7 días)',
        value: formatNumber(usersNewLast7Days),
        icon: TrendingUp,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
      },
      {
        label: 'Grupos activos',
        value: formatNumber(groupsActive),
        icon: Layers,
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
      },
      {
        label: 'Sesiones próximas',
        value: formatNumber(sessionsUpcoming),
        icon: Calendar,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
      },
      {
        label: 'Recursos publicados',
        value: formatNumber(resourcesTotal),
        icon: FileText,
        iconBg: 'bg-teal-100',
        iconColor: 'text-teal-600',
      },
      {
        label: 'Foros activos',
        value: formatNumber(forumsTotal),
        icon: Bell,
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-600',
      },
    ];
  }, [dashboardData]);

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      toast.info('Exportar dashboard', 'La funcionalidad de exportación estará disponible próximamente');
    }
  };

  return (
    <>
      {/* Stats */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Resumen general</h2>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            title="Exportar dashboard (próximamente)"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      {/* Gráficos y Visualizaciones */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de distribución de usuarios */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              Distribución de Usuarios
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-700">Activos</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{
                      width: `${dashboardData?.summaries?.users?.total > 0 
                        ? (dashboardData.summaries.users.active / dashboardData.summaries.users.total * 100) 
                        : 0}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-16 text-right">
                  {dashboardData?.summaries?.users?.active || 0}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-700">Inactivos</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{
                      width: `${dashboardData?.summaries?.users?.total > 0 
                        ? (dashboardData.summaries.users.inactive / dashboardData.summaries.users.total * 100) 
                        : 0}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-16 text-right">
                  {dashboardData?.summaries?.users?.inactive || 0}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                <span className="text-sm text-gray-700">Nuevos (7 días)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{
                      width: `${dashboardData?.summaries?.users?.total > 0 
                        ? (dashboardData.summaries.users.newLast7Days / dashboardData.summaries.users.total * 100) 
                        : 0}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-16 text-right">
                  {dashboardData?.summaries?.users?.newLast7Days || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de actividad de grupos */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Estado de Grupos
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-700">Activos</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{
                      width: `${dashboardData?.summaries?.groups?.total > 0 
                        ? (dashboardData.summaries.groups.active / dashboardData.summaries.groups.total * 100) 
                        : 0}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-16 text-right">
                  {dashboardData?.summaries?.groups?.active || 0}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-700">Pendientes</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all duration-500"
                    style={{
                      width: `${dashboardData?.summaries?.groups?.total > 0 
                        ? (dashboardData.summaries.groups.pending / dashboardData.summaries.groups.total * 100) 
                        : 0}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-16 text-right">
                  {dashboardData?.summaries?.groups?.pending || 0}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total de grupos:</span>
                <span className="font-semibold text-gray-900">
                  {dashboardData?.summaries?.groups?.total || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AdminDashboardStats;

