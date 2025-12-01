import React from 'react';

export const SectionCard = ({ title, icon: Icon, accent = 'bg-blue-50 text-blue-600', description, children }) => (
  <div className="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-[0_10px_35px_-15px_rgba(32,56,117,0.25)] backdrop-blur">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          {Icon && (
            <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
        </div>
      </div>
    </div>
    <div className="mt-6">{children}</div>
  </div>
);

