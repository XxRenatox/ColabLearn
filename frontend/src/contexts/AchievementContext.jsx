import React, { createContext, useContext, useState, useCallback } from 'react';
import { useApp } from './AppContext';
import { achievementsAPI } from '../services/api';
import AchievementToast from '../components/ui/AchievementToast';

const AchievementContext = createContext();

export const AchievementProvider = ({ children }) => {
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState(null);
  const { user: currentUser } = useApp();

  // Mostrar notificación de logro desbloqueado
  const showAchievementUnlocked = useCallback((achievement) => {
    setCurrentAchievement(achievement);
    setShowToast(true);
    
    // Ocultar la notificación después de 5 segundos
    setTimeout(() => {
      setShowToast(false);
    }, 5000);
  }, []);

  // Verificar si hay logros desbloqueados
  const checkForNewAchievements = useCallback(async () => {
    if (!currentUser) return [];
    try {
      const response = await achievementsAPI.checkAchievements();
      if (response && Array.isArray(response.newAchievements) && response.newAchievements.length > 0) {
        showAchievementUnlocked(response.newAchievements[0]);
        return response.newAchievements;
      }
      return [];
    } catch (error) {
      return [];
    }
  }, [currentUser, showAchievementUnlocked]);

  // Obtener logros del usuario
  const getUserAchievements = useCallback(async () => {
    if (!currentUser) return [];
    try {
      const response = await achievementsAPI.getUserAchievements();
      return response.achievements || [];
    } catch (error) {
      return [];
    }
  }, [currentUser]);

  // Cerrar notificación
  const closeToast = useCallback(() => {
    setShowToast(false);
    setCurrentAchievement(null);
  }, []);

  return (
    <AchievementContext.Provider
      value={{
        unlockedAchievements,
        showAchievementUnlocked,
        checkForNewAchievements,
        getUserAchievements,
      }}
    >
      {children}
      {showToast && currentAchievement && (
        <AchievementToast 
          achievement={currentAchievement} 
          onClose={closeToast} 
        />
      )}
    </AchievementContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements debe usarse dentro de un AchievementProvider');
  }
  return context;
};

export default AchievementContext;
