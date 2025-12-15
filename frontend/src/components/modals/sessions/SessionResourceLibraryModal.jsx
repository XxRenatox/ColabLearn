import React, { useState, useEffect } from 'react';
import { X, Search, FileText, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResourceCard } from '../../ui/cards/landing/ResourceCard';
import { resourcesAPI } from '../../../services/api';
import { useToast } from '../../ui/Toast';
import { getAuthToken } from '../../../services/tokenManager';

const SessionResourceLibraryModal = ({ isOpen, onClose, sessionId, groupId, onResourceAdded }) => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedResources, setSelectedResources] = useState(new Set());
    const [adding, setAdding] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            loadResources();
        }
    }, [isOpen, groupId]);

    const loadResources = async () => {
        try {
            setLoading(true);
            // Fetch public resources and group resources
            const response = await resourcesAPI.getResources({
                groupId,
                includePublic: true
            });

            const data = response?.data?.resources || response?.resources || [];
            setResources(Array.isArray(data) ? data : []);
        } catch (error) {
            addToast('Error cargando recursos', 'error');
        } finally {
            setLoading(false);
        }
    };

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

    const toggleResourceSelection = (resourceId) => {
        const newSelected = new Set(selectedResources);
        if (newSelected.has(resourceId)) {
            newSelected.delete(resourceId);
        } else {
            newSelected.add(resourceId);
        }
        setSelectedResources(newSelected);
    };

    const handleAddResources = async () => {
        if (selectedResources.size === 0) {
            addToast('Selecciona al menos un recurso', 'warning');
            return;
        }

        try {
            setAdding(true);
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const token = getAuthToken();

            // Add each selected resource
            for (const fileId of selectedResources) {
                const response = await fetch(`${API_URL}/sessions/${sessionId}/resources/link`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ file_id: fileId })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Error agregando recurso');
                }
            }

            addToast(`${selectedResources.size} recurso(s) agregado(s) a la sesión`, 'success');
            setSelectedResources(new Set()); // Reset selection
            if (onResourceAdded) onResourceAdded();
            onClose();
        } catch (error) {
            console.error('Error adding resources:', error);
            addToast(error.message || 'Error agregando recursos', 'error');
        } finally {
            setAdding(false);
        }
    };

    const filteredResources = resources.filter(r =>
        r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Biblioteca de Recursos</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Selecciona recursos públicos o del grupo para agregar a la sesión
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-6 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar recursos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Resources List */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                                <p className="text-gray-600">Cargando recursos...</p>
                            </div>
                        ) : filteredResources.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {filteredResources.map((resource) => (
                                    <div
                                        key={resource.id}
                                        onClick={() => toggleResourceSelection(resource.id)}
                                        className={`cursor-pointer transition-all ${selectedResources.has(resource.id)
                                            ? 'ring-2 ring-blue-500 bg-blue-50'
                                            : 'hover:shadow-lg'
                                            }`}
                                    >
                                        <ResourceCard
                                            resource={resource}
                                            getResourceTypeName={getResourceTypeName}
                                            formatFileSize={formatFileSize}
                                            canDelete={false}
                                        />
                                        {selectedResources.has(resource.id) && (
                                            <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                                                ✓
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600">
                                    {searchTerm ? 'No se encontraron recursos' : 'No hay recursos disponibles'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t bg-gray-50">
                        <p className="text-sm text-gray-600">
                            {selectedResources.size} recurso(s) seleccionado(s)
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddResources}
                                disabled={selectedResources.size === 0 || adding}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {adding ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Agregando...
                                    </>
                                ) : (
                                    `Agregar ${selectedResources.size > 0 ? `(${selectedResources.size})` : ''}`
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SessionResourceLibraryModal;
