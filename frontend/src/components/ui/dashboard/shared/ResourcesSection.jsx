import React from 'react';
import { FileText, Upload, FolderOpen } from 'lucide-react';
import { ResourceCard } from '../../cards/landing/ResourceCard';

const ResourcesSection = ({
  resources,
  isAdmin,
  isModerator,
  onUpload,
  onDownload,
  onView,
  onDelete
}) => {
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getResourceTypeName = (type) => {
    const ext = type?.toLowerCase() || '';
    const typeMap = {
      'pdf': '📄 PDF',
      'doc': '📝 Word',
      'docx': '📝 Word',
      'ppt': '📊 PowerPoint',
      'pptx': '📊 PowerPoint',
      'xls': '📈 Excel',
      'xlsx': '📈 Excel',
      'jpg': '🖼️ Imagen',
      'jpeg': '🖼️ Imagen',
      'png': '🖼️ Imagen',
      'gif': '🖼️ Imagen',
      'txt': '📃 Texto',
      'zip': '📦 Archivo',
      'rar': '📦 Archivo'
    };
    return typeMap[ext] || '📄 Documento';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Recursos del Grupo
        </h3>
        {(isAdmin || isModerator) && (
          <button
            onClick={onUpload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
          >
            <Upload className="w-4 h-4" /> Subir Recurso
          </button>
        )}
      </div>

      {resources.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onView={onView}
              onDownload={onDownload}
              onDelete={onDelete}
              getResourceTypeName={getResourceTypeName}
              formatFileSize={formatFileSize}
              canDelete={isAdmin || isModerator}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
          <FolderOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">No hay recursos subidos todavía.</p>
        </div>
      )}
    </div>
  );
};

export default ResourcesSection;

