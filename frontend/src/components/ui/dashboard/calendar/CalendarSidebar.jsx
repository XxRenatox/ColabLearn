import React, { useMemo } from 'react';
import { Calendar as CalendarIcon, Users, Flame, BookmarkCheck, MapPin } from 'lucide-react';

const formatDate = (date) =>
  date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

const CalendarSidebar = ({
  selectedDate,
  events,
  getEventsForDate,
  handleStartSession,
  onDateSelect,
  liveSessions = [],
  upcomingSessions = [],
  loading = false,
}) => {
  const eventsForSelectedDate = useMemo(
    () => getEventsForDate(selectedDate),
    [selectedDate, events, getEventsForDate]
  );

  const importantEvents = useMemo(
    () => events.filter((e) => e.priority === 'high').slice(0, 4),
    [events]
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {liveSessions.length > 0 && (
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500 text-white shadow-lg sm:rounded-3xl">
          <div className="border-b border-white/20 px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide sm:text-sm">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-white"></span>
              Sesiones en vivo
            </div>
            <p className="mt-1 text-xs text-white/80 sm:text-sm">
              Únete a la conversación antes de que termine el tiempo.
            </p>
          </div>
          <div className="divide-y divide-white/15">
            {liveSessions.map((session) => (
              <div key={session.id} className="px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="truncate text-sm font-semibold sm:text-base">{session.title}</h4>
                    <p className="truncate text-[11px] text-white/80 sm:text-xs">{session.group}</p>
                    <p className="text-[11px] font-medium text-white/90 sm:text-xs">
                      {session.startTime} - {session.endTime}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/15 sm:h-10 sm:w-10 sm:rounded-xl">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <button
                  onClick={() => handleStartSession(session)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-white sm:mt-4 sm:py-2 sm:text-sm"
                >
                  Unirse ahora
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:rounded-3xl sm:p-6">
        <header className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 sm:text-xs">
              Agenda del día
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">{formatDate(selectedDate)}</h3>
            <p className="text-[11px] text-slate-500 sm:text-xs">
              {eventsForSelectedDate.length
                ? `${eventsForSelectedDate.length} evento${
                    eventsForSelectedDate.length > 1 ? 's' : ''
                  } programado${eventsForSelectedDate.length > 1 ? 's' : ''}`
                : 'Sin eventos registrados para este día'}
            </p>
          </div>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500 sm:h-12 sm:w-12 sm:rounded-2xl">
            <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </header>

        <div className="mt-4 space-y-2 sm:mt-5 sm:space-y-3">
          {eventsForSelectedDate.length === 0 && !loading && (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 p-4 text-center text-xs text-gray-500 sm:rounded-2xl sm:p-5 sm:text-sm">
              No hay eventos programados. Aprovecha para repasar o crear un nuevo recordatorio.
            </div>
          )}

          {eventsForSelectedDate.map((event) => {
            const isSession = event.type === 'session';
            const runtimeStatus = event.runtimeStatus || event.status;
            const isLive = runtimeStatus === 'in_progress';
            const badgeClass = isSession
              ? isLive
                ? 'bg-red-100 text-red-600'
                : runtimeStatus === 'completed'
                ? 'bg-slate-200 text-slate-600'
                : 'bg-blue-100 text-blue-600'
              : 'bg-emerald-100 text-emerald-600';

            return (
              <div
                key={event.id}
                className="group rounded-xl border border-gray-100 bg-slate-50/60 p-3 transition hover:border-blue-200 hover:bg-white hover:shadow-md sm:rounded-2xl sm:p-4"
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl ${
                      isSession ? 'bg-blue-500/10 text-blue-600' : 'bg-emerald-500/10 text-emerald-500'
                    }`}
                  >
                    {isSession ? <Users className="h-4 w-4 sm:h-5 sm:w-5" /> : <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:text-xs ${badgeClass}`}>
                        {isSession ? 'Sesión' : 'Evento'}
                      </span>
                      {isLive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 sm:px-2 sm:text-xs">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"></span>
                          En vivo
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 sm:text-sm">{event.title}</h4>
                      {event.group && (
                        <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">
                          <MapPin className="mr-1 inline h-3 w-3 text-slate-400 sm:h-3.5 sm:w-3.5" />
                          {event.group}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600 sm:gap-3 sm:text-xs">
                      <span className="font-medium text-slate-700">
                        {event.startTime} - {event.endTime}
                      </span>
                      {event.location && (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] sm:px-2 sm:text-xs">
                          {event.location}
                        </span>
                      )}
                    </div>
                    {isSession && (
                      <button
                        onClick={() => handleStartSession(event)}
                        disabled={!['scheduled', 'in_progress'].includes(runtimeStatus)}
                        className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300 sm:mt-0 sm:w-auto sm:text-xs"
                      >
                        {runtimeStatus === 'scheduled'
                          ? 'Iniciar sesión'
                          : runtimeStatus === 'in_progress'
                          ? 'Unirse ahora'
                          : 'Finalizada'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:rounded-3xl sm:p-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-500 sm:text-xs">
              Próximas sesiones
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">Lo que viene</h3>
          </div>
          <BookmarkCheck className="h-5 w-5 text-emerald-400 sm:h-6 sm:w-6" />
        </header>
        {upcomingSessions.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-600 sm:mt-4 sm:rounded-2xl sm:p-4 sm:text-sm">
            Aún no hay sesiones futuras registradas para este mes.
          </div>
        ) : (
          <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
            {upcomingSessions.slice(0, 4).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-white/70 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/60 sm:gap-3 sm:rounded-2xl sm:p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900 sm:text-sm">{session.title}</p>
                  <p className="text-[10px] text-slate-500 sm:text-xs">
                    {session.startDate.toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    · {session.startTime}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Solo seleccionar la fecha de la sesión en el calendario, no iniciar/unirse
                    if (onDateSelect && session.startDate) {
                      onDateSelect(session.startDate);
                    }
                  }}
                  className="flex-shrink-0 rounded-full border border-emerald-400 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 transition hover:bg-emerald-500 hover:text-white sm:px-3 sm:text-xs"
                >
                  Ver
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:rounded-3xl sm:p-6">
        <header className="mb-3 flex items-center gap-2 sm:mb-4">
          <Flame className="h-4 w-4 text-orange-500 sm:h-5 sm:w-5" />
          <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Eventos prioritarios</h3>
        </header>
        {importantEvents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-orange-200 bg-orange-50/60 p-3 text-xs text-orange-600 sm:rounded-2xl sm:p-4 sm:text-sm">
            Aún no marcas eventos como prioritarios.
          </p>
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {importantEvents.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-orange-100 bg-gradient-to-r from-orange-50 to-rose-50 p-3 sm:gap-3 sm:rounded-2xl sm:p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900 sm:text-sm">{event.title}</p>
                  <p className="text-[10px] text-slate-600 sm:text-xs">
                    {event.startDate.toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    · {event.startTime}
                  </p>
                </div>
                <span className="flex-shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-orange-500 sm:px-2 sm:text-xs">
                  Alta
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default CalendarSidebar;
