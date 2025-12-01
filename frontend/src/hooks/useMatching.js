import { useState, useCallback } from 'react';
import { matchingAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';

export const useMatching = () => {
  const [groupRecommendations, setGroupRecommendations] = useState([]);
  const [userRecommendations, setUserRecommendations] = useState([]);
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  // Obtener recomendaciones de grupos
  const fetchGroupRecommendations = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await matchingAPI.getGroupRecommendations(params);
      const payload = response?.data || response;
      setGroupRecommendations(payload?.recommendations || []);
      return payload;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al obtener recomendaciones de grupos';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Obtener recomendaciones de usuarios para un grupo
  const fetchUserRecommendations = useCallback(async (groupId, params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await matchingAPI.getUserRecommendations(groupId, params);
      const payload = response?.data || response;
      setUserRecommendations(payload?.recommendations || []);
      return payload;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al obtener recomendaciones de usuarios';
      setError(errorMessage);
      addToast?.(errorMessage, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Obtener preferencias de matching del usuario
  const fetchPreferences = useCallback(async () => {
    try {
      const response = await matchingAPI.getPreferences();

      // Mapear la estructura del backend a la estructura que espera el componente
      const backendPreferences = response.data?.preferences || {};
      const mappedPreferences = {
        subjects: backendPreferences.subjects || [],
        interests: backendPreferences.subjects || [], // Usamos subjects como interests también
        study_preferences: {
          preferred_times: backendPreferences.studyTimes || [],
          group_size: backendPreferences.groupSize || 'any',
          study_style: backendPreferences.studyStyle?.[0] || 'mixed'
        }
      };

      setPreferences(mappedPreferences);
      return { preferences: mappedPreferences };
    } catch (err) {
      return null;
    }
  }, []);

  // Actualizar preferencias de matching
  const updatePreferences = useCallback(async (user, newPreferences) => {
    try {
      if (!user) {
        throw new Error('Datos del usuario no disponibles');
      }

      if (!newPreferences) {
        throw new Error('Datos de preferencias no disponibles');
      }

      // Mapear la estructura del frontend a la estructura que espera el backend
      const requestBody = {
        subjects: newPreferences.subjects || [],
        interests: newPreferences.interests || [],
        study_preferences: {
          preferred_times: newPreferences.study_preferences?.preferred_times || [],
          group_size: newPreferences.study_preferences?.group_size || 'any',
          study_style: newPreferences.study_preferences?.study_style || 'mixed'
        }
      };

      const response = await matchingAPI.updatePreferences(requestBody);
      setPreferences(response.data?.preferences || {});
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    groupRecommendations,
    userRecommendations,
    preferences,
    loading,
    error,
    fetchGroupRecommendations,
    fetchUserRecommendations,
    fetchPreferences,
    updatePreferences,
  };
};
