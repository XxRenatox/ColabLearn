import { useState, useCallback } from 'react';
import { groupsAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';

export const useGroups = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toastContext = useToast();
  const addToast = toastContext?.addToast || (() => {});

  const createGroup = useCallback(async (groupData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await groupsAPI.createGroup(groupData);
      const payload = response?.data || response;
      addToast?.('Grupo creado exitosamente', 'success');
      return payload;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error creando el grupo';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const joinGroup = useCallback(async (groupId, inviteCode = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await groupsAPI.joinGroup(groupId, inviteCode ? { inviteCode } : {});
      const payload = response?.data || response;
      // No mostrar toast aquí, dejar que el componente lo maneje según el estado
      return payload;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error uniéndose al grupo';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const leaveGroup = useCallback(async (groupId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await groupsAPI.leaveGroup(groupId);
      const payload = response?.data || response;
      addToast?.('Has salido del grupo exitosamente', 'success');
      return payload;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error saliendo del grupo';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const searchGroups = useCallback(async (searchParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Usar el endpoint de grupos con filtros de búsqueda
      const params = {
        ...searchParams,
        public: true,
        limit: searchParams.limit || 20
      };
      const response = await groupsAPI.getGroups(params);
      return response?.data || response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error buscando grupos';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const getGroups = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Si no se especifica public, asumir que queremos grupos públicos para explorar
      const publicParams = params.public !== false ? { ...params, public: true } : params;
      const response = await groupsAPI.getGroups(publicParams);
      return response?.data || response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error obteniendo grupos';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getGroup = useCallback(async (groupId, silent = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await groupsAPI.getGroup(groupId);
      return response?.data || response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error obteniendo el grupo';
      setError(errorMessage);
      // Solo mostrar toast si no es modo silencioso
      if (!silent) {
        addToast?.(errorMessage, 'error');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const updateGroup = useCallback(async (groupId, groupData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await groupsAPI.updateGroup(groupId, groupData);
      const payload = response?.data || response;
      addToast?.('Grupo actualizado exitosamente', 'success');
      return payload;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error actualizando el grupo';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const deleteGroup = useCallback(async (groupId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await groupsAPI.deleteGroup(groupId);
      const payload = response?.data || response;
      addToast?.('Grupo eliminado exitosamente', 'success');
      return payload;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error eliminando el grupo';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  return {
    loading,
    error,
    createGroup,
    joinGroup,
    leaveGroup,
    searchGroups,
    getGroups,
    getGroup,
    updateGroup,
    deleteGroup,
  };
};
