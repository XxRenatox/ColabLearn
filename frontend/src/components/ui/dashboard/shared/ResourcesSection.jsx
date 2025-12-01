import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Download, Eye, FolderOpen, Image, BookOpen, Activity } from 'lucide-react';

const ResourcesSection = ({ 
  resources, 
  isAdmin, 
  isModerator, 
  onUpload, 
  onDownload, 
  onView 
}) => {
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (ext) => {
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <Image className="w-6 h-6 text-purple-600" />;
    if (['pdf'].includes(ext)) return <FileText className="w-6 h-6 text-red-600" />;
    if (['doc', 'docx'].includes(ext)) return <BookOpen className="w-6 h-6 text-blue-600" />;
    if (['ppt', 'pptx'].includes(ext)) return <Activity className="w-6 h-6 text-orange-600" />;
    return <FileText className="w-6 h-6 text-gray-600" />;
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
          {resources.map((r, i) => {
            const ext = r.name?.split('.').pop()?.toLowerCase() || '';
            const color =
              ext === 'pdf'
                ? 'from-red-500/20 to-red-300/10 text-red-600'
                : ext === 'docx' || ext === 'doc'
                ? 'from-blue-500/20 to-blue-300/10 text-blue-600'
                : ext === 'ppt' || ext === 'pptx'
                ? 'from-orange-500/20 to-orange-300/10 text-orange-600'
                : ext === 'jpg' || ext === 'png'
                ? 'from-purple-500/20 to-purple-300/10 text-purple-600'
                : 'from-gray-300/20 to-gray-100/10 text-gray-700';

            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`bg-gradient-to-br ${color} border border-gray-200 shadow-sm rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    {getFileIcon(ext)}
                  </div>
                  <div className="flex flex-col truncate">
                    <p className="font-medium text-gray-900 truncate">{r.name || 'Archivo sin nombre'}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(r.size)} • {r.uploaded_at ? new Date(r.uploaded_at).toLocaleDateString() : 'sin fecha'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onDownload(r.id)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Descargar</span>
                  </button>

                  <button
                    onClick={() => onView(r.id)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-sm transition"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Ver</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
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

