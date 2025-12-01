import { useState, useCallback } from 'react';
import { sessionsAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';

export const useSessions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const createSession = useCallback(async (sessionData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await sessionsAPI.createSession(sessionData);
      addToast('Sesión creada exitosamente', 'success');
      return response.data;
    } catch (err) {
      // Log detallado del error
      console.error('Error en createSession:', err);
      console.error('Error completo:', {
        message: err.message,
        status: err.status,
        response: err.response,
        responseData: err.response?.data,
        errors: err.errors,
        original: err.original
      });
      
      // El error puede venir de buildError, que transforma la estructura
      // Intentar obtener el mensaje de diferentes formas
      const errorMessage = err.message || err.response?.data?.message || err.original?.message || 'Error creando la sesión';
      const errors = err.errors || err.response?.data?.errors || err.original?.errors || [];
      
      // Si hay errores de validación, mostrar el primero
      if (errors.length > 0) {
        const firstError = errors[0];
        const detailedMessage = `${errorMessage}: ${firstError.msg || firstError.message || JSON.stringify(firstError)}`;
        setError(detailedMessage);
        addToast(detailedMessage, 'error');
      } else {
        setError(errorMessage);
        addToast(errorMessage, 'error');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const joinSession = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await sessionsAPI.joinSession(sessionId);
      addToast(response.message || 'Te has unido a la sesión exitosamente', 'success');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error uniéndose a la sesión';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const leaveSession = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await sessionsAPI.leaveSession(sessionId);
      addToast('Has salido de la sesión exitosamente', 'success');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error saliendo de la sesión';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

    const deleteSession = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await sessionsAPI.deleteSession(sessionId);
      addToast('Sesión eliminada exitosamente', 'success');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error eliminando la sesión';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);


  const getSessions = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await sessionsAPI.getSessions(params);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error obteniendo sesiones';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSession = useCallback(async (sessionId, sessionData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await sessionsAPI.updateSession(sessionId, sessionData);
      addToast('Sesión actualizada exitosamente', 'success');
      // Retornar la sesión actualizada desde response.data.data.session
      return response.data?.data?.session || response.data?.session || response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error actualizando la sesión';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const getGroupSessions = useCallback(async (groupId, params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await sessionsAPI.getGroupSessions(groupId, params);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error obteniendo sesiones del grupo';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createSession,
    joinSession,
    leaveSession,
    deleteSession,
    getSessions,
    getGroupSessions,
    updateSession,
  };
};
