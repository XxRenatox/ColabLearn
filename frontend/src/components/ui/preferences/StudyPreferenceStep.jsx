import React from "react";
import { Clock } from "lucide-react";


const StudyPreferenceStep = ({ preferences, setPreferences }) => {
    return (
        <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Clock className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Preferencias de Estudio
        </h2>
        <p className="text-gray-600">
          ¿Cómo prefieres organizar tus sesiones de estudio?
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Duración ideal de sesión de estudio
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: '30min', label: '30 min', desc: 'Rápido' },
              { value: '1h', label: '1 hora', desc: 'Estándar' },
              { value: '2h', label: '2 horas', desc: 'Intenso' },
              { value: '3h+', label: '3+ horas', desc: 'Maratón' }
            ].map(duration => (
              <button
                key={duration.value}
                onClick={() => setPreferences(prev => ({ ...prev, sessionDuration: duration.value }))}
                className={`p-4 border-2 rounded-xl transition-all text-center ${
                  preferences.sessionDuration === duration.value
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="font-semibold">{duration.label}</div>
                <div className="text-sm text-gray-500">{duration.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Frecuencia de estudio semanal
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { value: 'casual', label: '1-2 veces', desc: 'Estudio casual', icon: '🌱' },
              { value: 'regular', label: '3-4 veces', desc: 'Estudio regular', icon: '📚' },
              { value: 'intenso', label: '5+ veces', desc: 'Estudio intensivo', icon: '🔥' }
            ].map(freq => (
              <button
                key={freq.value}
                onClick={() => setPreferences(prev => ({ ...prev, studyFrequency: freq.value }))}
                className={`p-4 border-2 rounded-xl transition-all ${
                  preferences.studyFrequency === freq.value
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="text-2xl mb-2">{freq.icon}</div>
                <div className="font-semibold">{freq.label}</div>
                <div className="text-sm text-gray-500">{freq.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Tamaño de grupo preferido
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'individual', label: '1:1', desc: 'Solo conmigo', icon: '👤' },
              { value: 'small', label: '2-3', desc: 'Grupo pequeño', icon: '👥' },
              { value: 'medium', label: '4-6', desc: 'Grupo mediano', icon: '👪' },
              { value: 'large', label: '7+', desc: 'Grupo grande', icon: '🏢' }
            ].map(size => (
              <button
                key={size.value}
                onClick={() => setPreferences(prev => ({ ...prev, groupSize: size.value }))}
                className={`p-4 border-2 rounded-xl transition-all text-center ${
                  preferences.groupSize === size.value
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="text-2xl mb-2">{size.icon}</div>
                <div className="font-semibold">{size.label}</div>
                <div className="text-sm text-gray-500">{size.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
    )
}

export default StudyPreferenceStep;