import React, { useState, useEffect, useMemo, useRef } from 'react';
import CreateSessionModal from '../../../modals/sessions/CreateSessionModal';
import CreateEventModal from '../../../modals/events/CreateEventModal';
import CalendarGrid from './CalendarGrid';
import CalendarSidebar from './CalendarSidebar';
import { useSessions } from '../../../../hooks/useSessions';
import { useToast } from '../../../ui/Toast';
import { useCalendarData } from '../../../../hooks/useCalendarData';
import { useSessionOperations } from '../../../../hooks/useSessionOperations';
import { useSessionNotifications, requestNotificationPermission } from '../../../../hooks/useSessionNotifications';
import {
  Plus,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ChevronDown,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const monthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const extractDateKey = (value) => {
  if (!value || typeof value !== 'string') return null;
  const [datePart] = value.split('T');
  return datePart || null;
};

const formatTimeLabel = (date) =>
  date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

const normalizeToLocalDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);

const CalendarSection = ({ user, groups = [], onJoinSession }) => {
  const today = normalizeToLocalDay(new Date());
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const { updateSession } = useSessions();
  const { addToast } = useToast();

  const { sessions, calendarEvents, loading, refreshing, loadSessions, loadCalendarEvents } =
    useCalendarData();

  const userGroups = useMemo(
    () => groups.filter((g) => ['admin', 'moderator', 'member'].includes(g.userRole)),
    [groups]
  );

  const { handleStartSession: handleSessionOp } = useSessionOperations(
    updateSession,
    addToast,
    userGroups,
    loadSessions
  );

  useEffect(() => {
    loadSessions();
    loadCalendarEvents(currentDate);
    
    // Solicitar permisos de notificación al cargar el componente
    requestNotificationPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hook para notificaciones de sesiones 1 hora antes
  useSessionNotifications(sessions);

  useEffect(() => {
    const interval = setInterval(() => {
      const hasActiveSessions = sessions.some((s) => ['active', 'in_progress'].includes(s.status));
      if (hasActiveSessions) {
        loadSessions(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [sessions, loadSessions]);

  useEffect(() => {
    if (!showDropdown) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const sessionEvents = useMemo(() => {
    const now = Date.now();
    return sessions.map((s) => {
      const start = new Date(s.scheduled_date);
      const end = new Date(start.getTime() + (s.duration || 120) * 60000);
      const startMs = start.getTime();
      const endMs = end.getTime();

      let runtimeStatus = s.status || 'scheduled';
      if (runtimeStatus !== 'cancelled') {
        if (endMs <= now) {
          runtimeStatus = 'completed';
        } else if (startMs <= now && endMs > now) {
          runtimeStatus = 'in_progress';
        } else {
          runtimeStatus = 'scheduled';
        }
      }

      return {
        id: s.id,
        title: s.title,
        type: 'session',
        date: extractDateKey(s.scheduled_date) || formatDateKey(start),
        startDate: start,
        endDate: end,
        startTime: formatTimeLabel(start),
        endTime: formatTimeLabel(end),
        status: s.status,
        runtimeStatus,
        isSession: true,
        priority: s.priority || 'medium',
        group: s.groups?.name || 'Sin grupo',
        groupId: s.group_id,
        location: s.location_details || 'Ubicación no especificada',
        metadata: s,
      };
    });
  }, [sessions]);

  const eventItems = useMemo(() => {
    return calendarEvents.map((e) => {
      const start = new Date(e.start_date);
      const end = new Date(e.end_date);
      return {
        id: e.id,
        title: e.title,
        type: e.event_type,
        date: extractDateKey(e.start_date) || formatDateKey(start),
        startDate: start,
        endDate: end,
        startTime: formatTimeLabel(start),
        endTime: formatTimeLabel(end),
        status: 'scheduled',
        runtimeStatus: 'scheduled',
        isCalendarEvent: true,
        priority: e.priority || 'medium',
        group: e.groups?.name || e.group_name || 'General',
        location: e.location || 'Sin ubicación',
        metadata: e,
      };
    });
  }, [calendarEvents]);

  const events = useMemo(() => {
    return [...sessionEvents, ...eventItems].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );
  }, [sessionEvents, eventItems]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < first.getDay(); i++) {
      days.push({ date: new Date(year, month, i - first.getDay() + 1), isCurrentMonth: false });
    }

    for (let i = 1; i <= last.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    while (days.length < 42) {
      days.push({
        date: new Date(year, month + 1, days.length - last.getDate() - first.getDay() + 1),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    const normalizedDate = normalizeToLocalDay(date);
    const key = formatDateKey(normalizedDate);
    
    // Comparar usando tanto event.date como event.startDate normalizado
    return events.filter((event) => {
      if (!event.startDate) return false;
      
      // Normalizar la fecha del evento para comparación
      const normalizedEventDate = normalizeToLocalDay(event.startDate);
      const eventKey = formatDateKey(normalizedEventDate);
      
      // Comparar con la clave de fecha o con startDate normalizado
      return eventKey === key || (event.date && event.date === key);
    });
  };

  const changeMonth = (delta) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + delta);
      const normalized = normalizeToLocalDay(next);
      loadCalendarEvents(normalized);
      return normalized;
    });
  };

  const handleStartSession = async (event) => {
    const result = await handleSessionOp(event);
    if (result === 'join' && onJoinSession) {
      onJoinSession(event);
    }
  };

  const handleDayClick = (date) => {
    if (!date) return;
    const normalized = normalizeToLocalDay(date);
    setSelectedDate(normalized);
    // Asegurar que el mes actual muestre esta fecha si está fuera del mes visible
    const normalizedYear = normalized.getFullYear();
    const normalizedMonth = normalized.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    if (normalizedYear !== currentYear || normalizedMonth !== currentMonth) {
      setCurrentDate(normalized);
      loadCalendarEvents(normalized);
    }
  };

  const selectedDayEvents = useMemo(() => getEventsForDate(selectedDate), [selectedDate, events]);
  const liveSessions = useMemo(
    () =>
      events.filter((event) => event.isSession && event.runtimeStatus === 'in_progress'),
    [events]
  );
  const upcomingSessions = useMemo(() => {
    const now = new Date();
    return sessionEvents
      .filter((event) => event.startDate >= now)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [sessionEvents]);

  // Filtrar sesiones y eventos del mes actual
  const currentMonthEvents = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getFullYear() === year &&
        eventDate.getMonth() === month
      );
    });
  }, [events, currentDate]);

  const currentMonthSessions = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return sessionEvents.filter((event) => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getFullYear() === year &&
        eventDate.getMonth() === month
      );
    });
  }, [sessionEvents, currentDate]);

  const monthTotalSessions = currentMonthSessions.length;
  const completedSessions = currentMonthSessions.filter(
    (event) => event.runtimeStatus === 'completed'
  ).length;
  const totalEvents = currentMonthEvents.length;
  const isInitialLoading = loading && events.length === 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 sm:rounded-3xl">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:gap-4 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => changeMonth(-1)}
              className="rounded-full border border-gray-200 p-1.5 text-gray-600 transition hover:border-blue-500 hover:text-blue-600 sm:p-2"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 sm:text-xs">
                Calendario académico
              </p>
              <h2 className="text-lg font-semibold text-gray-900 sm:text-xl md:text-2xl">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
            </div>
            <button
              onClick={() => changeMonth(1)}
              className="rounded-full border border-gray-200 p-1.5 text-gray-600 transition hover:border-blue-500 hover:text-blue-600 sm:p-2"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={() => {
              const now = normalizeToLocalDay(new Date());
              setCurrentDate(now);
              setSelectedDate(now);
              loadCalendarEvents(now);
              }}
              className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-100 sm:px-3 sm:text-sm"
            >
              Hoy
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                loadSessions(true);
                loadCalendarEvents(currentDate, true);
              }}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''} sm:h-4 sm:w-4`} />
              <span className="hidden sm:inline">{refreshing ? 'Actualizando' : 'Actualizar'}</span>
              <span className="sm:hidden">{refreshing ? '...' : '↻'}</span>
            </button>

            {userGroups.some((g) => ['admin', 'moderator'].includes(g.userRole)) && (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setShowDropdown((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:from-indigo-500 hover:to-blue-500 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Nuevo</span>
                  <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                {showDropdown && (
                  <div className="absolute right-0 z-10 mt-2 w-44 rounded-2xl border border-gray-100 bg-white p-2 shadow-lg sm:w-48">
                    <button
                      onClick={() => {
                        setShowCreateModal(true);
                        setShowDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 sm:text-sm"
                    >
                      <Users className="h-3.5 w-3.5 text-blue-500 sm:h-4 sm:w-4" />
                      Nueva sesión
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateEventModal(true);
                        setShowDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 sm:text-sm"
                    >
                      <Calendar className="h-3.5 w-3.5 text-emerald-500 sm:h-4 sm:w-4" />
                      Nuevo evento
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-6 md:grid-cols-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 sm:rounded-2xl sm:p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 sm:text-xs">
                  Sesiones del mes
                </p>
                <p className="mt-1.5 text-2xl font-semibold text-blue-900 sm:mt-2 sm:text-3xl">{monthTotalSessions}</p>
              </div>
              <Clock className="h-8 w-8 flex-shrink-0 text-blue-400 sm:h-10 sm:w-10" />
            </div>
            <p className="mt-2 text-[11px] text-blue-700/80 sm:mt-3 sm:text-xs">
              {upcomingSessions.length
                ? `${upcomingSessions.length} próximas sesiones programadas`
                : 'No hay sesiones próximas, crea una nueva para mantener tu ritmo.'}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 sm:rounded-2xl sm:p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 sm:text-xs">
                  Eventos totales
                </p>
                <p className="mt-1.5 text-2xl font-semibold text-emerald-900 sm:mt-2 sm:text-3xl">{totalEvents}</p>
              </div>
              <Calendar className="h-8 w-8 flex-shrink-0 text-emerald-400 sm:h-10 sm:w-10" />
            </div>
            <p className="mt-2 text-[11px] text-emerald-700/80 sm:mt-3 sm:text-xs">
              Incluye sesiones, recordatorios y eventos personales registrados este mes.
            </p>
          </div>
          <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3 sm:col-span-2 sm:rounded-2xl sm:col-span-1 sm:p-4 md:col-span-1">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-600 sm:text-xs">
                  Sesiones completadas
                </p>
                <p className="mt-1.5 text-2xl font-semibold text-purple-900 sm:mt-2 sm:text-3xl">{completedSessions}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 flex-shrink-0 text-purple-400 sm:h-10 sm:w-10" />
            </div>
            <p className="mt-2 text-[11px] text-purple-700/80 sm:mt-3 sm:text-xs">
              Mantén el historial actualizado para medir tu progreso semanal.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[2fr_1fr]">
        {isInitialLoading ? (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-6 text-center text-xs text-blue-600 sm:rounded-3xl sm:p-10 sm:text-sm xl:col-span-2">
            Cargando tu calendario...
          </div>
        ) : (
          <>
            <CalendarGrid
              currentDate={currentDate}
              events={events}
              getDaysInMonth={getDaysInMonth}
              getEventsForDate={getEventsForDate}
              handleStartSession={handleStartSession}
              onDayClick={handleDayClick}
              selectedDate={selectedDate}
            />

            <CalendarSidebar
              selectedDate={selectedDate}
              events={events}
              getEventsForDate={getEventsForDate}
              handleStartSession={handleStartSession}
              onDateSelect={handleDayClick}
              liveSessions={liveSessions}
              upcomingSessions={upcomingSessions}
              loading={loading}
            />
          </>
        )}
      </div>

      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSessionCreated={() => loadSessions(true)}
        availableGroups={userGroups.filter((g) => ['admin', 'moderator'].includes(g.userRole))}
      />

      <CreateEventModal
        isOpen={showCreateEventModal}
        onClose={() => setShowCreateEventModal(false)}
        onEventCreated={() => loadCalendarEvents(currentDate, true)}
        userGroups={userGroups}
      />
    </div>
  );
};

export default CalendarSection;
