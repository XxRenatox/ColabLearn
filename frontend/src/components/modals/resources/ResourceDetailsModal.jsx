import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Download,
  Trash2,
  FileText,
  Calendar,
  User,
  Tag,
  FolderOpen,
  Link,
  BookOpen,
} from "lucide-react";

const ResourceDetailsModal = ({
  isOpen,
  resource,
  onClose,
  onDownload,
  onDelete,
  loading = false,
  canDelete = false,
}) => {
  if (!isOpen || !resource) return null;

  const createdAt = resource.created_at
    ? new Date(resource.created_at).toLocaleString("es-ES")
    : "Fecha no disponible";

  const description = resource.description || "Este recurso no tiene descripción.";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6 text-white">
            <div>
              <h2 className="text-2xl font-semibold">{resource.name}</h2>
              <p className="mt-1 text-sm text-indigo-100">
                {resource.resource_type_label || "Recurso compartido"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 transition hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <section className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600">
                <FileText className="h-4 w-4 text-gray-500" />
                Información del recurso
              </h3>
              <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line break-words">
                {description}
              </p>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 p-4">
                <div className="flex items-center gap-2 text-sm text-indigo-600">
                  <User className="h-4 w-4" />
                  Publicado por
                </div>
                <p className="mt-2 text-base font-semibold text-indigo-900">
                  {resource.uploader?.name || "Usuario"}
                </p>
                <p className="text-xs text-indigo-700">
                  {resource.uploader?.email || ""}
                </p>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <Calendar className="h-4 w-4" />
                  Fecha de publicación
                </div>
                <p className="mt-2 text-base font-semibold text-emerald-900">
                  {createdAt}
                </p>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4">
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Tag className="h-4 w-4" />
                  Tipo de recurso
                </div>
                <p className="mt-2 text-base font-semibold text-blue-900">
                  {resource.display_type || resource.resource_type_label || resource.resource_type}
                </p>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 p-4">
                <div className="flex items-center gap-2 text-sm text-rose-600">
                  <FolderOpen className="h-4 w-4" />
                  Estadísticas
                </div>
                <p className="mt-2 text-base font-semibold text-rose-900">
                  {resource.download_count || 0} descargas
                </p>
                {resource.file_size_formatted && (
                  <p className="text-xs text-rose-700">
                    Tamaño: {resource.file_size_formatted}
                  </p>
                )}
              </div>
            </section>

            {resource.tags?.length > 0 && (
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  Etiquetas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {resource.url && (
              <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex items-start gap-3">
                  <Link className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">Enlace</p>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline break-all"
                    >
                      {resource.url}
                    </a>
                  </div>
                </div>
              </section>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 p-4">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-white"
            >
              Cerrar
            </button>
            {canDelete && (
              <button
                onClick={onDelete}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {loading ? "Eliminando..." : "Eliminar"}
              </button>
            )}
            <button
              onClick={onDownload}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {loading ? "Descargando..." : "Descargar"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ResourceDetailsModal;

