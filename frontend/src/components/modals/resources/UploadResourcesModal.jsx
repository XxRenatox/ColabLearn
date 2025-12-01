import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  X, Upload, FileText, Shield, AlertTriangle, 
  BookOpen, File, Link as LinkIcon, PenTool, 
  Book, Video, Wrench, Package 
} from 'lucide-react';

const UploadResourceModal = ({ isOpen, onClose, onUpload, uploading, groupId = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    is_public: true,
    group_id: groupId || '',
    resource_type: 'document'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // Función para resetear el formulario
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      is_public: true,
      group_id: groupId || '',
      resource_type: 'document'
    });
    setSelectedFile(null);
    setErrors({});
    // Resetear el input de archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [groupId]);

  // Actualizar group_id cuando cambie el prop
  useEffect(() => {
    if (groupId !== null) {
      setFormData(prev => ({ ...prev, group_id: groupId }));
    }
  }, [groupId]);

  // Resetear formulario cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const validateForm = () => {
    const newErrors = {};

    if (!selectedFile) {
      newErrors.file = 'Debes seleccionar un archivo';
    } else {
      // Validar tamaño del archivo (5MB máximo)
      if (selectedFile.size > 5 * 1024 * 1024) {
        newErrors.file = 'El archivo no puede ser mayor a 5MB';
      }

      // Validar tipo de archivo
      const allowedTypes = [
        'application/pdf',
        'text/plain',
        'application/rtf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/zip'
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        newErrors.file = 'Tipo de archivo no permitido. Solo se permiten documentos PDF, texto, imágenes y archivos ZIP.';
      }
    }

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const uploadData = new FormData();

      // Agregar archivo
      uploadData.append('file', selectedFile);

      // Agregar datos del formulario
      uploadData.append('name', formData.name.trim());
      uploadData.append('is_public', formData.is_public.toString());
      uploadData.append('resource_type', formData.resource_type);
      if (formData.group_id) {
        uploadData.append('group_id', formData.group_id);
      }

      await onUpload(uploadData);
      resetForm();
      onClose();
    } catch (error) {
      // El error ya se maneja en el componente padre
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-llenar nombre si está vacío
      if (!formData.name) {
        setFormData(prev => ({
          ...prev,
          name: file.name.replace(/\.[^/.]+$/, "") // Remover extensión
        }));
      }
      // Limpiar error de archivo
      if (errors.file) {
        setErrors(prev => ({ ...prev, file: null }));
      }
    }
  };

  if (!isOpen) return null;

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
              <h2 className="text-2xl font-semibold">Subir Recurso</h2>
              <p className="mt-1 text-sm text-indigo-100">
                Comparte documentos, guías y materiales de estudio
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="text-white/70 transition hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Archivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Archivo * <span className="text-xs text-gray-500 font-normal">(máx. 5MB)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.file ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  accept=".pdf,.txt,.rtf,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.zip"
                  required
                />
                {selectedFile && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Tamaño: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
                {errors.file && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.file}
                  </p>
                )}
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Recurso *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Ej: Guía de Cálculo Diferencial"
                  required
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {errors.name}
                  </p>
                )}
              </div>

              {/* Tipo de Recurso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Recurso *
                </label>
                <select
                  value={formData.resource_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, resource_type: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors hover:border-gray-400"
                >
                  <option value="guide">Guía de Estudio</option>
                  <option value="document">Documento</option>
                  <option value="link">Enlace</option>
                  <option value="exercise">Ejercicios</option>
                  <option value="material_theory">Material Teórico</option>
                  <option value="video">Video</option>
                  <option value="tool">Herramienta</option>
                  <option value="other">Otro</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Selecciona el tipo de recurso para facilitar la búsqueda y organización
                </p>
              </div>

              {/* Público */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label htmlFor="is_public" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Recurso público
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    Visible para toda la comunidad
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Advertencia de seguridad */}
              <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      Seguridad
                    </p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Los archivos son escaneados automáticamente para detectar contenido malicioso.
                      Solo se permiten tipos de archivo seguros.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Subir Recurso
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UploadResourceModal;
