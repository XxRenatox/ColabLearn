import { useMemo } from 'react';

export const useSessionCategorization = (sessions, user) => {
  return useMemo(() => {
    const now = new Date();
    const upcoming = [];
    const active = [];
    const completed = [];

    sessions.forEach(session => {
      if (!session.scheduled_date) return;
      
      const scheduledDate = new Date(session.scheduled_date);
      const durationMinutes = session.duration || 120;
      const sessionEnd = new Date(scheduledDate.getTime() + durationMinutes * 60000);
      
      let actualStatus = session.status;
      
      // Si la sesión ya está en progreso, mantenerla como activa
      if (actualStatus === 'in_progress') {
        // Verificar que no haya terminado
        if (sessionEnd < now) {
          actualStatus = 'completed';
        }
        // Si no ha terminado, mantener como 'in_progress'
      } else if (actualStatus !== 'completed' && actualStatus !== 'cancelled') {
        // Para sesiones programadas, calcular el estado basado en fechas
        if (sessionEnd < now) {
          actualStatus = 'completed';
        } else if (scheduledDate <= now && sessionEnd > now) {
          actualStatus = 'in_progress';
        } else if (scheduledDate > now) {
          actualStatus = 'scheduled';
        }
      }
      
      const sessionData = {
        ...session,
        attendees: session.attendees || session.session_attendance || [],
        organizer_name: session.organizer?.name || session.organizer_name || user?.name || 'Usuario',
        group_name: session.groups?.name || session.group_name || 'Sin grupo',
        max_attendees: session.max_attendees || session.max_participants || 10,
        location_type: session.location_type || (session.location_details ? 'presencial' : 'virtual'),
        type: session.type || session.session_type || 'study',
        description: session.description || session.notes || '',
      };
      
      if (actualStatus === 'completed' || session.status === 'completed') {
        completed.push({
          ...sessionData,
          average_rating: session.average_rating || null,
          session_notes: session.session_notes || null,
          xp_earned: session.xp_earned || 0
        });
      } else if (actualStatus === 'in_progress') {
        // Si la sesión está en progreso, verificar que no haya terminado
        if (sessionEnd > now) {
          const startTime = session.actual_start_time ? new Date(session.actual_start_time) : scheduledDate;
          const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60)));
          
          if (elapsedMinutes >= 0 && elapsedMinutes <= durationMinutes) {
            active.push({
              ...sessionData,
              timeElapsed: elapsedMinutes,
              participants: session.attendees?.length || session.session_attendance?.length || 0,
            });
          } else {
            completed.push({
              ...sessionData,
              average_rating: session.average_rating || null,
              session_notes: session.session_notes || null,
              xp_earned: session.xp_earned || 0
            });
          }
        } else {
          // La sesión en progreso ya terminó
          completed.push({
            ...sessionData,
            average_rating: session.average_rating || null,
            session_notes: session.session_notes || null,
            xp_earned: session.xp_earned || 0
          });
        }
      } else if (scheduledDate > now) {
        upcoming.push(sessionData);
      } else {
        completed.push({
          ...sessionData,
          average_rating: session.average_rating || null,
          session_notes: session.session_notes || null,
          xp_earned: session.xp_earned || 0
        });
      }
    });

    upcoming.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
    active.sort((a, b) => (b.timeElapsed || 0) - (a.timeElapsed || 0));
    // Ordenar completadas por fecha descendente (más recientes primero)
    completed.sort((a, b) => {
      const dateA = new Date(a.scheduled_date || a.actual_end_time || 0);
      const dateB = new Date(b.scheduled_date || b.actual_end_time || 0);
      return dateB - dateA; // Más recientes primero
    });

    return { upcoming, active, completed };
  }, [sessions, user]);
};

