import React from "react";

export const ActivityCard = ({ 
  title, 
  items = [], 
  emptyMessage, 
  formatDate,
  borderColor = "border-sky-100",
  gradientFrom = "from-indigo-50",
  gradientVia = "via-white",
  gradientTo = "to-sky-50"
}) => {
  return (
    <div className={`rounded-3xl bg-white p-6 shadow-sm border ${borderColor} overflow-y-auto max-h-[380px] scrollbar-thin scrollbar-thumb-indigo-200`}>
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        {title}
      </h3>
      {items.length > 0 ? (
        items.map((item, index) => (
          <div
            key={item.id || index}
            className={`mb-3 rounded-2xl border ${borderColor} bg-gradient-to-r ${gradientFrom} ${gradientVia} ${gradientTo} p-3 transition hover:border-indigo-200 hover:shadow`}
          >
            <p className="text-sm font-semibold text-slate-900">
              {item.title || item.name || "Actividad"}
            </p>
            {item.scheduled_date && formatDate && (
              <p className="text-xs text-slate-500">
                {formatDate(item.scheduled_date)}
              </p>
            )}
            {(item.group?.name || item.group_name) && (
              <p className="text-xs text-slate-400">
                {item.group?.name || item.group_name || "Grupo general"}
              </p>
            )}
            {item.created_at && formatDate && (
              <p className="text-xs text-slate-500">
                {formatDate(item.created_at || item.date)}
              </p>
            )}
          </div>
        ))
      ) : (
        <p className="text-sm text-slate-500">
          {emptyMessage || "No hay elementos disponibles"}
        </p>
      )}
    </div>
  );
};

