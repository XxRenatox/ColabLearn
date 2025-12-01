import { useState, useCallback } from 'react';

export const useActiveSession = () => {
  const [activeSession, setActiveSession] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);

  const joinSession = useCallback((session) => {
    setActiveSession(session);
    setShowSessionModal(true);
  }, []);

  const leaveSession = useCallback(() => {
    setActiveSession(null);
    setShowSessionModal(false);
  }, []);

  return {
    activeSession,
    showSessionModal,
    joinSession,
    leaveSession,
    setShowSessionModal
  };
};
