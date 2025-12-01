import { useState, useCallback } from 'react';
import { resourcesAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';

export const useResources = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toastContext = useToast();
  const addToast = toastContext?.addToast || (() => {});

  const getResources = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await resourcesAPI.getResources(params);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error obteniendo recursos';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const getResource = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await resourcesAPI.getResource(id);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error obteniendo recurso';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const uploadResource = useCallback(async (formData) => {
    setLoading(true);
    setError(null)

    try {
      const response = await resourcesAPI.uploadResource(formData);
      addToast?.('Recurso subido exitosamente', 'success');
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error subiendo recurso';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const downloadResource = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await resourcesAPI.downloadResource(id);
      const responseData = response?.data || response;
      
      // Si la respuesta incluye una URL de descarga, descargar el archivo
      if (responseData?.download_url) {
        const downloadUrl = responseData.download_url;
        // Usar original_name si está disponible, sino name, y asegurar extensión
        const originalName = responseData?.resource?.original_name || responseData?.resource?.name || `recurso-${id}`;
        const mimeType = responseData?.resource?.mime_type || '';
        
        // Determinar extensión basada en mime type si no está en el nombre
        let resourceName = originalName;
        if (!resourceName.includes('.')) {
          const extensionMap = {
            'application/pdf': '.pdf',
            'text/plain': '.txt',
            'application/rtf': '.rtf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'application/zip': '.zip'
          };
          const extension = extensionMap[mimeType] || '';
          resourceName = `${resourceName}${extension}`;
        }
        
        // Intentar descargar usando fetch primero (para mejor control)
        try {
          const fileResponse = await fetch(downloadUrl, {
            method: 'GET',
            mode: 'cors',
          });
          
          if (!fileResponse.ok) {
            throw new Error(`HTTP error! status: ${fileResponse.status}`);
          }
          
          const blob = await fileResponse.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          // Crear un enlace temporal y hacer clic para descargar
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = resourceName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          
          // Limpiar después de un breve delay
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
          }, 100);
          
          addToast?.('Descarga completada', 'success');
        } catch (fetchError) {
          // Si fetch falla (por CORS u otro motivo), usar enlace directo
          // Esto abrirá la descarga en una nueva pestaña/ventana
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = resourceName;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          
          // Limpiar después de un breve delay
          setTimeout(() => {
            document.body.removeChild(link);
          }, 100);
          
          addToast?.('Descarga iniciada', 'success');
        }
      } else {
        addToast?.('No se pudo obtener la URL de descarga', 'error');
      }
      
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error descargando recurso';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const deleteResource = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      await resourcesAPI.deleteResource(id);
      addToast?.('Recurso eliminado exitosamente', 'success');
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error eliminando recurso';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const getCategories = useCallback(async () => {
    // Categorías estáticas - ya no se cargan desde el backend
    const staticCategories = {
      guias_estudio: 'Guías de estudio y apuntes resumidos',
      apuntes: 'Apuntes de clases y notas personales',
      ejercicios: 'Ejercicios resueltos y problemas',
      material_teorico: 'Material teórico complementario',
      videos: 'Enlaces a videos educativos',
      herramientas: 'Herramientas y software útil',
      otros: 'Otros recursos'
    };

    return {
      data: {
        categories: Object.keys(staticCategories),
        descriptions: staticCategories
      }
    };
  }, []);

  return {
    loading,
    error,
    getResources,
    getResource,
    uploadResource,
    downloadResource,
    deleteResource,
    getCategories,
  };
};
