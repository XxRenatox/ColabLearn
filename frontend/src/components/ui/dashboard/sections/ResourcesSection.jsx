import React, { useState, useEffect } from "react";
import {
  Search,
  FileText,
  Download,
  Eye,
  Trash2,
  Plus,
  BookOpen,
  Link as LinkIcon,
  PenTool,
  Book,
  Video,
  Wrench,
  Package,
} from "lucide-react";
import { useResources } from "../../../../hooks/useResources";
import { useToast } from "../../../ui/Toast";
import UploadResourceModal from "../../../modals/resources/UploadResourcesModal";
import ResourceDetailsModal from "../../../modals/resources/ResourceDetailsModal";
import { ResourceCard } from "../../../ui/cards/landing/ResourceCard";
import ConfirmModal from "../../../modals/ConfirmModal";

const ResourcesSection = ({ user, token }) => {
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const { getResources, uploadResource, downloadResource, deleteResource, loading } = useResources();
  const { addToast } = useToast();

  // Cargar recursos al montar y cuando cambie el filtro
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    refreshResources();
  }, [filterType]);

  // Manejar subida de recurso
  const handleUploadResource = async (resourceData) => {
    try {
      setUploadingResource(true);
      await uploadResource(resourceData);
      setShowUploadModal(false);
      await refreshResources();
    } catch (error) {
      // Error uploading resource
    } finally {
      setUploadingResource(false);
    }
  };

  // Manejar descarga de recurso
  const handleDownloadResource = async (resourceId) => {
    try {
      await downloadResource(resourceId);
      await refreshResources();
    } catch (error) {
      // Error downloading resource
    }
  };

  // Manejar eliminación de recurso
  const handleDeleteResource = async (resourceId) => {
    setResourceToDelete(resourceId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteResource = async () => {
    if (!resourceToDelete) return;
    try {
      await deleteResource(resourceToDelete);
      await refreshResources();
      setShowDeleteConfirm(false);
      setResourceToDelete(null);
    } catch (error) {
      // Error deleting resource
      setShowDeleteConfirm(false);
      setResourceToDelete(null);
    }
  };

  // Obtener icono según tipo de recurso
  const getResourceTypeIcon = (resourceType) => {
    // Por ahora todos usan FileText, pero se puede mejorar con iconos específicos
    return FileText;
  };

  // Obtener nombre legible del tipo de recurso
  const getResourceTypeName = (resourceType) => {
    const types = {
      'guide': 'Guía de Estudio',
      'document': 'Documento',
      'link': 'Enlace',
      'exercise': 'Ejercicios',
      'material_theory': 'Material Teórico',
      'video': 'Video',
      'tool': 'Herramienta',
      'other': 'Otro'
    };
    return types[resourceType] || 'Documento';
  };

  // Filtrar recursos por búsqueda
  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.uploader?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const refreshResources = async () => {
    try {
      const params = {};
      if (filterType !== "all") {
        params.resource_type = filterType;
      }
      const response = await getResources(params);
      if (response?.data?.resources) {
        // Filtrar solo recursos públicos
        const publicResources = response.data.resources.filter(
          resource => resource.is_public === true
        );
        setResources(publicResources);
      }
    } catch (error) {
      // Error refreshing resources
    }
  };

  const openResourceModal = (resource) => {
    setSelectedResource({
      ...resource,
      resource_type_label: getResourceTypeName(resource.resource_type),
      file_size_formatted: formatFileSize(resource.size || 0),
      owner_id: resource.uploaded_by ?? resource.uploader?.id,
    });
    setShowResourceModal(true);
  };

  const closeResourceModal = () => {
    setShowResourceModal(false);
    setSelectedResource(null);
    setModalLoading(false);
  };

  const handleDownloadFromModal = async () => {
    if (!selectedResource) return;
    try {
      setModalLoading(true);
      await handleDownloadResource(selectedResource.id);
      addToast("Descarga iniciada", "success");
    } catch (error) {
      addToast("No se pudo descargar el recurso", "error");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteFromModal = async () => {
    if (!selectedResource) return;
    try {
      setModalLoading(true);
      await handleDeleteResource(selectedResource.id);
      addToast("Recurso eliminado", "success");
      closeResourceModal();
    } catch (error) {
      addToast("No se pudo eliminar el recurso", "error");
      setModalLoading(false);
    }
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-end mb-6">
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Subir Recurso</span>
        </button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar recursos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Filtro:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="guide">Guías de Estudio</option>
              <option value="document">Documentos</option>
              <option value="exercise">Ejercicios</option>
              <option value="material_theory">Material Teórico</option>
              <option value="video">Videos</option>
              <option value="tool">Herramientas</option>
              <option value="link">Enlaces</option>
              <option value="other">Otros</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de recursos */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando recursos...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay recursos disponibles
            </h3>
            <p className="text-gray-600 mb-4">
              Sé el primero en compartir un recurso con la comunidad
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Subir Primer Recurso
            </button>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron recursos
            </h3>
            <p className="text-gray-600">
              {searchQuery ? 'Intenta con otros términos de búsqueda' : 'No hay recursos de este tipo'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onView={openResourceModal}
                onDownload={handleDownloadResource}
                onDelete={handleDeleteResource}
                getResourceTypeName={getResourceTypeName}
                formatFileSize={formatFileSize}
                canDelete={resource.uploaded_by === user?.id || resource.uploader?.id === user?.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de subida de recursos */}
      {showUploadModal && (
        <UploadResourceModal    
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadResource}
          uploading={uploadingResource}
        />
      )}

      {showResourceModal && selectedResource && (
        <ResourceDetailsModal
          isOpen={showResourceModal}
          resource={selectedResource}
          onClose={closeResourceModal}
          onDownload={handleDownloadFromModal}
          onDelete={handleDeleteFromModal}
          loading={modalLoading}
          canDelete={selectedResource.owner_id === user?.id}
        />
      )}

      {/* Modal de confirmación para eliminar recurso */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setResourceToDelete(null);
        }}
        onConfirm={confirmDeleteResource}
        title="Eliminar recurso"
        message="¿Estás seguro de que deseas eliminar este recurso? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default ResourcesSection;
