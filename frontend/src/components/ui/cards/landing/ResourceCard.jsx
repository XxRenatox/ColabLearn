import React from "react";
import { FileText, Download, Eye, Trash2, Calendar, User } from "lucide-react";
import Avatar from "../../Avatar";

export const ResourceCard = ({ 
  resource, 
  onView, 
  onDownload, 
  onDelete,
  getResourceTypeName,
  formatFileSize,
  canDelete = false
}) => {
  const Icon = FileText;
  const typeName = getResourceTypeName ? getResourceTypeName(resource.resource_type) : '📄 Documento';
  const fileSize = formatFileSize ? formatFileSize(resource.size || 0) : '';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate mb-1">
              {resource.name}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {typeName}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(resource);
              }}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Ver detalles"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {onDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(resource.id);
              }}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Descargar"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          {canDelete && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(resource.id);
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {resource.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {resource.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          {resource.uploader && (
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span className="truncate max-w-[120px]">
                {resource.uploader.name || 'Usuario'}
              </span>
            </div>
          )}
          {fileSize && (
            <span>{fileSize}</span>
          )}
        </div>
        {resource.created_at && (
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(resource.created_at).toLocaleDateString("es-ES")}
            </span>
          </div>
        )}
      </div>

      {resource.download_count !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {resource.download_count} descarga{resource.download_count !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

