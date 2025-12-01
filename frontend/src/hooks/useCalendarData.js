import { useState, useCallback } from 'react';
import { calendarAPI } from '../services/api';
import { getAuthToken } from '../services/tokenManager';

export const useCalendarData = () => {
  const [sessions, setSessions] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- Cargar sesiones ---
  const loadSessions = useCallback(async (refresh = false) => {
    setLoading(!refresh);
    setRefreshing(refresh);
    try {
      const token = getAuthToken();
      if (!token) {
        setSessions([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sessions?user_groups=false`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      // Filtrar sesiones con fechas válidas
      const validSessions = (data.data?.sessions || []).filter(
        s => s.scheduled_date && new Date(s.scheduled_date).getTime() > 0
      );
      setSessions(validSessions);
    } catch (err) {
      setSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // --- Cargar eventos del calendario ---
  const loadCalendarEvents = useCallback(async (date = new Date(), refresh = false) => {
    setRefreshing(refresh);
    try {
      // 🔹 Forzar conversión a Date (corrige el error)
      const d = new Date(date);
      if (isNaN(d.getTime())) throw new Error('Fecha inválida');

      let year = d.getFullYear();
      let month = d.getMonth() + 1;

      // Salvaguarda: si el año es menor a 2020, usar fecha actual
      if (year < 2020) {
        const current = new Date();
        year = current.getFullYear();
        month = current.getMonth() + 1;
      }

      const res = await calendarAPI.getMonthEvents(year, month);
      // Filtrar eventos con fechas válidas
      const validEvents = (res.data?.events || []).filter(
        e => e.start_date && new Date(e.start_date).getTime() > 0
      );
      setCalendarEvents(validEvents);
    } catch (err) {
      setCalendarEvents([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return {
    sessions,
    setSessions,
    calendarEvents,
    setCalendarEvents,
    loading,
    refreshing,
    loadSessions,
    loadCalendarEvents
  };
};
