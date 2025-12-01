import React from 'react';
import { Activity } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { formatDateTime } from '@/utils/adminUtils';

export const AdminActivityFeed = ({ 
  activity, 
  pagination, 
  onPageChange,
  loading = false 
}) => {
  const activityList = activity?.list || [];
  const latestActivity = activity?.latestActivity || [];

  const displayActivity = activityList.length > 0 ? activityList : latestActivity;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Actividad reciente</h3>
        <p className="text-sm text-gray-500">Eventos del sistema y notificaciones generadas.</p>
      </div>
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
        {loading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            Cargando actividad...
          </div>
        ) : displayActivity.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            No hay actividad reciente registrada.
          </div>
        ) : (
          displayActivity.map((item) => (
            <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <span className="text-xs text-gray-400">
                      {formatDateTime(item.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{item.message}</p>
                  <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 mt-2">
                    {item.type}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {pagination && pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={onPageChange}
          totalItems={pagination.total || displayActivity.length}
          itemsPerPage={pagination.limit}
        />
      )}
    </div>
  );
};

export default AdminActivityFeed;

