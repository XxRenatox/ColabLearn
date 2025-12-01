import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { achievementsAPI } from '../services/api';

export const useAchievements = () => {
  const { user: currentUser } = useApp();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar logros del usuario
  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await achievementsAPI.getUserAchievements();
      const formattedAchievements = (response.achievements || []).map(ua => ({
        ...ua.achievements,
        unlocked: !!ua.unlocked_at,
        unlockedAt: ua.unlocked_at,
        progress: ua.progress || 0
      }));
      setAchievements(formattedAchievements);
    } catch (err) {
      setError('Error al cargar los logros');
    } finally {
      setLoading(false);
    }
  };

  // Verificar desbloqueo de logros
  const checkForNewAchievements = async () => {
    try {
      await achievementsAPI.checkAchievements();
      // Recargar logros después de verificar
      await fetchAchievements();
    } catch (err) {
      // Error al verificar logros
    }
  };

  // Cargar logros al montar el componente
  useEffect(() => {
    if (currentUser) {
      fetchAchievements();
    }
  }, [currentUser]);

  return {
    achievements,
    loading,
    error,
    refreshAchievements: fetchAchievements,
    checkForNewAchievements
  };
};

export default useAchievements;
