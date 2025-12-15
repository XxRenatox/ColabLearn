import { useCallback } from 'react';

export const useSessionOperations = (updateSession, addToast, userGroups, loadSessions) => {
  const canJoinSession = useCallback((event) => {
    if (!event) return { canJoin: false, reason: 'Evento no válido' };

    const now = new Date();
    // Usar startDate del evento o metadata si está disponible
    const start = event.startDate ? new Date(event.startDate) :
      (event.metadata?.scheduled_date ? new Date(event.metadata.scheduled_date) : null);

    if (!start || isNaN(start.getTime())) {
      return { canJoin: false, reason: 'Fecha de sesión no válida' };
    }

    const end = new Date(start);
    const duration = event.metadata?.duration || 120;
    end.setMinutes(start.getMinutes() + duration + 30);

    if (now > end) return { canJoin: false, reason: 'La sesión ya terminó' };
    return { canJoin: true };
  }, []);

  const handleStartSession = useCallback(async (event) => {
    if (!event || !event.isSession) return;

    const { canJoin, reason } = canJoinSession(event);
    if (!canJoin) {
      addToast(reason, 'warning');
      return;
    }

    try {
      const runtimeStatus = event.runtimeStatus || event.status;

      if (runtimeStatus === 'scheduled') {
        // Solo admin/moderador puede iniciar sesiones
        const userRole = userGroups.find(g => g.id === event.groupId)?.userRole;
        if (!['admin', 'moderator'].includes(userRole)) {
          addToast('Solo administradores y moderadores pueden iniciar sesiones', 'error');
          return;
        }

        // Validar que la sesión no sea demasiado futura (opcional: permitir hasta 1 hora antes)
        const now = new Date();
        const start = event.startDate ? new Date(event.startDate) :
          (event.metadata?.scheduled_date ? new Date(event.metadata.scheduled_date) : null);

        if (start && start > now) {
          const hoursUntilStart = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
          // Permitir iniciar sesiones hasta 1 hora antes de su inicio programado
          if (hoursUntilStart > 1) {
            addToast(`La sesión está programada para ${hoursUntilStart.toFixed(1)} horas en el futuro. Solo puedes iniciarla hasta 1 hora antes.`, 'warning');
            return;
          }
        }

        await updateSession(event.id, { status: 'in_progress' });
        addToast('Sesión iniciada correctamente', 'success');
        await loadSessions(true);
      } else if (['in_progress', 'active'].includes(runtimeStatus)) {
        // Esto será manejado por el componente padre
        return 'join';
      }
    } catch (err) {

      addToast('Error al iniciar la sesión', 'error');
    }
  }, [canJoinSession, addToast, userGroups, updateSession, loadSessions]);

  return {
    canJoinSession,
    handleStartSession
  };
};
