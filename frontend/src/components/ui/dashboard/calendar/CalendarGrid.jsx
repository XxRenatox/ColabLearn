import React from 'react';
import { Users, Calendar as CalendarIcon, MoreHorizontal } from 'lucide-react';

const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const CalendarGrid = ({
  currentDate,
  getDaysInMonth,
  getEventsForDate,
  handleStartSession,
  onDayClick,
  selectedDate,
}) => {
  const isToday = (date) => date.toDateString() === new Date().toDateString();
  const isSelected = (date) =>
    selectedDate && date.toDateString() === selectedDate.toDateString();

  return (
    <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100 sm:rounded-3xl sm:p-6">
      <header className="grid grid-cols-7 gap-1 border-b border-gray-100 pb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 sm:gap-2 sm:pb-3 sm:text-xs">
        {weekdays.map((day) => (
          <div key={day} className="truncate">{day}</div>
        ))}
      </header>

      <div className="mt-2 grid grid-cols-7 gap-1 sm:mt-3 sm:gap-2">
        {getDaysInMonth(currentDate).map((day, index) => {
          const dayEvents = getEventsForDate(day.date);
          const today = isToday(day.date);
          const selected = isSelected(day.date);

          return (
            <button
              key={`${day.date.toISOString()}-${index}`}
              type="button"
              onClick={() => onDayClick?.(day.date)}
              className={[
                'group flex min-h-[60px] flex-col rounded-lg border border-transparent bg-slate-50/70 p-1.5 text-left transition hover:border-blue-200 hover:bg-white hover:shadow-md sm:min-h-[90px] sm:rounded-2xl sm:p-2 md:min-h-[110px] md:p-3',
                !day.isCurrentMonth && 'bg-transparent text-gray-400 hover:bg-slate-50/60',
                today && 'border-blue-200 bg-blue-50/70',
                selected && 'border-2 border-blue-500 bg-white shadow-lg',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 sm:text-sm">
                <span className={`${today ? 'text-blue-600' : ''}`}>{day.date.getDate()}</span>
                {dayEvents.length > 0 && (
                  <span className="hidden items-center gap-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600 sm:inline-flex sm:px-2 sm:text-[10px]">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Mostrar solo en pantallas medianas y grandes */}
              <div className="mt-1.5 hidden space-y-1 sm:mt-2 sm:block md:space-y-2">
                {dayEvents.slice(0, 2).map((event) => {
                  const isSession = event.type === 'session';
                  const status = event.runtimeStatus || event.status;
                  const baseColor =
                    status === 'in_progress'
                      ? 'bg-red-500/90 text-white'
                      : status === 'completed'
                      ? 'bg-slate-500/90 text-white'
                      : isSession
                      ? 'bg-blue-500/90 text-white'
                      : 'bg-emerald-500/80 text-white';

                  return (
                    <div
                      key={`${event.id}-preview`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSession) handleStartSession?.(event);
                      }}
                      className={`flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 text-[10px] font-medium shadow-sm transition hover:opacity-90 md:gap-2 md:rounded-xl md:px-2 md:py-1 md:text-xs ${baseColor}`}
                    >
                      {isSession ? (
                        <Users className="h-3 w-3 flex-shrink-0 md:h-3.5 md:w-3.5" />
                      ) : (
                        <CalendarIcon className="h-3 w-3 flex-shrink-0 md:h-3.5 md:w-3.5" />
                      )}
                      <span className="truncate text-[10px] md:text-xs">
                        {event.startTime}
                      </span>
                    </div>
                  );
                })}

                {dayEvents.length > 2 && (
                  <div className="flex items-center gap-1 text-[10px] font-medium text-gray-500 md:text-[11px]">
                    <MoreHorizontal className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    +{dayEvents.length - 2}
                  </div>
                )}
              </div>

              {/* Indicador móvil: solo mostrar número si hay eventos */}
              {dayEvents.length > 0 && (
                <div className="mt-1 flex items-center justify-center sm:hidden">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white">
                    {dayEvents.length}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default CalendarGrid;
