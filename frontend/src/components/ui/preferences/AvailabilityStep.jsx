import React from "react";
import { Calendar } from "lucide-react";

const timeSlots = [
  { id: "morning", label: "Mañana", time: "6:00 - 12:00", icon: "🌅" },
  { id: "afternoon", label: "Tarde", time: "12:00 - 18:00", icon: "☀️" },
  { id: "evening", label: "Noche", time: "18:00 - 22:00", icon: "🌆" },
  { id: "late", label: "Madrugada", time: "22:00 - 2:00", icon: "🌙" },
];

const weekDays = [
  { id: "monday", label: "Lun", full: "Lunes" },
  { id: "tuesday", label: "Mar", full: "Martes" },
  { id: "wednesday", label: "Mié", full: "Miércoles" },
  { id: "thursday", label: "Jue", full: "Jueves" },
  { id: "friday", label: "Vie", full: "Viernes" },
  { id: "saturday", label: "Sáb", full: "Sábado" },
  { id: "sunday", label: "Dom", full: "Domingo" },
];

const DisponibilyStep = ({ setPreferences, handleMultiSelect, preferences }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Tu Disponibilidad
        </h2>
        <p className="text-gray-600">¿Cuándo tienes tiempo para estudiar?</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Días de la semana disponibles
          </label>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <button
                key={day.id}
                onClick={() => handleMultiSelect("weekDays", day.id)}
                className={`p-3 border-2 rounded-xl transition-all text-center ${
                  preferences.weekDays.includes(day.id)
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className="font-semibold text-sm">{day.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Horarios preferidos (puedes elegir varios)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => handleMultiSelect("timeSlots", slot.id)}
                className={`p-4 border-2 rounded-xl transition-all text-center ${
                  preferences.timeSlots.includes(slot.id)
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className="text-2xl mb-2">{slot.icon}</div>
                <div className="font-semibold">{slot.label}</div>
                <div className="text-sm text-gray-500">{slot.time}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Zona horaria
          </label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={preferences.timezone}
            onChange={(e) =>
              setPreferences((prev) => ({ ...prev, timezone: e.target.value }))
            }
          >
            <option value="America/Santiago">America/Santiago (GMT-3)</option>
            <option value="America/New_York">America/New_York (GMT-4)</option>
            <option value="America/Los_Angeles">
              America/Los_Angeles (GMT-7)
            </option>
            <option value="Europe/Madrid">Europe/Madrid (GMT+2)</option>
            <option value="Europe/London">Europe/London (GMT+1)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
            <option value="Australia/Sydney">Australia/Sydney (GMT+10)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default DisponibilyStep;
