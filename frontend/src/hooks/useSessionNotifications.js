import { useEffect, useRef } from 'react';
import { useToast } from '../components/ui/Toast';

/**
 * Hook para mostrar notificaciones 1 hora antes de que comiencen las sesiones
 * @param {Array} sessions - Array de sesiones
 */
export const useSessionNotifications = (sessions = []) => {
  const { addToast } = useToast();
  const notifiedSessionsRef = useRef(new Set()); // IDs de sesiones ya notificadas

  useEffect(() => {
    if (!sessions || sessions.length === 0) return;

    const checkUpcomingSessions = () => {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora en milisegundos

      sessions.forEach((session) => {
        // Solo verificar sesiones programadas (scheduled)
        if (session.status !== 'scheduled' && session.status !== 'pending') return;

        // Evitar notificar la misma sesión múltiples veces
        if (notifiedSessionsRef.current.has(session.id)) return;

        try {
          const sessionStart = new Date(session.scheduled_date);

          // Verificar si la sesión comienza en aproximadamente 1 hora (±5 minutos de margen)
          const timeDiff = sessionStart.getTime() - now.getTime();
          const hoursUntilStart = timeDiff / (1000 * 60 * 60);

          // Notificar si falta entre 55 minutos y 65 minutos (ventana de 10 minutos)
          if (hoursUntilStart >= 0.916 && hoursUntilStart <= 1.083) {
            const minutesUntilStart = Math.round(timeDiff / (1000 * 60));

            // Marcar como notificada
            notifiedSessionsRef.current.add(session.id);

            // Formatear la hora de inicio
            const startTime = sessionStart.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            });

            // Mostrar notificación toast
            addToast(
              `Sesión próxima: "${session.title}" comienza en ${minutesUntilStart} minutos (${startTime})`,
              'info',
              {
                duration: 10000, // 10 segundos
              }
            );

            // Intentar mostrar notificación del navegador si está disponible
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification('Sesión próxima', {
                  body: `La sesión "${session.title}" comenzará a las ${startTime}`,
                  icon: '/favicon.ico', // Puedes cambiar esto por un icono personalizado
                  tag: `session-${session.id}`, // Evita notificaciones duplicadas
                  requireInteraction: false,
                });
              } catch (err) {

              }
            }
          }
        } catch (err) {

        }
      });
    };

    // Verificar inmediatamente
    checkUpcomingSessions();

    // Verificar cada minuto
    const interval = setInterval(checkUpcomingSessions, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, [sessions, addToast]);

  // Limpiar sesiones notificadas que ya pasaron o fueron canceladas
  useEffect(() => {
    const now = new Date();
    const notifiedIds = Array.from(notifiedSessionsRef.current);

    notifiedIds.forEach((sessionId) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) {
        // Sesión eliminada, remover de notificadas
        notifiedSessionsRef.current.delete(sessionId);
      } else {
        const sessionStart = new Date(session.scheduled_date);
        // Si la sesión ya comenzó o fue cancelada, remover de notificadas
        if (sessionStart < now || session.status === 'cancelled' || session.status === 'completed') {
          notifiedSessionsRef.current.delete(sessionId);
        }
      }
    });
  }, [sessions]);
};

/**
 * Función helper para solicitar permisos de notificación del navegador
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {

    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {

      return false;
    }
  }

  return false;
};

