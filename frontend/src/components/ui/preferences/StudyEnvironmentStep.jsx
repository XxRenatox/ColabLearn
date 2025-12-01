import React from "react";
import { MapPin } from "lucide-react";

const studyStyles = [
  {
    id: "visual",
    label: "Visual",
    icon: "👀",
    description: "Diagramas, mapas mentales, colores",
  },
  {
    id: "auditivo",
    label: "Auditivo",
    icon: "👂",
    description: "Explicaciones verbales, discusiones",
  },
  {
    id: "kinestesico",
    label: "Kinestésico",
    icon: "✋",
    description: "Práctica, movimiento, manipulación",
  },
  {
    id: "lectura",
    label: "Lectura/Escritura",
    icon: "📝",
    description: "Textos, resúmenes, listas",
  },
];

const StudyEnvironmentStep = ({
  setPreferences,
  handleMultiSelect,
  preferences,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Ambiente de Estudio
        </h2>
        <p className="text-gray-600">¿Dónde y cómo te gusta estudiar?</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Lugares donde prefieres estudiar (puedes elegir varios)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                value: "casa",
                label: "En casa",
                desc: "Comodidad del hogar",
                icon: "🏠",
              },
              {
                value: "biblioteca",
                label: "Biblioteca",
                desc: "Ambiente académico",
                icon: "📚",
              },
              {
                value: "cafe",
                label: "Café",
                desc: "Ambiente relajado",
                icon: "☕",
              },
              {
                value: "universidad",
                label: "Universidad",
                desc: "Campus universitario",
                icon: "🎓",
              },
              {
                value: "online",
                label: "Online",
                desc: "Videoconferencia",
                icon: "💻",
              },
              {
                value: "parque",
                label: "Al aire libre",
                desc: "Espacios abiertos",
                icon: "🌳",
              },
            ].map((location) => (
              <button
                key={location.value}
                onClick={() =>
                  handleMultiSelect("studyLocation", location.value)
                }
                className={`p-4 border-2 rounded-xl transition-all text-left ${
                  preferences.studyLocation.includes(location.value)
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{location.icon}</span>
                  <div>
                    <div className="font-semibold">{location.label}</div>
                    <div className="text-sm text-gray-500">{location.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Nivel de ruido preferido
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                value: "silencio",
                label: "Silencio total",
                desc: "Sin ruido",
                icon: "🤫",
              },
              {
                value: "bajo",
                label: "Ruido ambiente",
                desc: "Sonido suave",
                icon: "🔉",
              },
              {
                value: "alto",
                label: "Ruido moderado",
                desc: "Conversación baja",
                icon: "🔊",
              },
            ].map((noise) => (
              <button
                key={noise.value}
                onClick={() =>
                  setPreferences((prev) => ({
                    ...prev,
                    noiseLevel: noise.value,
                  }))
                }
                className={`p-4 border-2 rounded-xl transition-all text-center ${
                  preferences.noiseLevel === noise.value
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className="text-2xl mb-2">{noise.icon}</div>
                <div className="font-semibold">{noise.label}</div>
                <div className="text-sm text-gray-500">{noise.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            ¿Cómo aprendes mejor? (puedes elegir varios)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {studyStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => handleMultiSelect("studyStyle", style.id)}
                className={`p-4 border-2 rounded-xl transition-all text-left ${
                  preferences.studyStyle.includes(style.id)
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{style.icon}</span>
                  <div>
                    <div className="font-semibold">{style.label}</div>
                    <div className="text-sm text-gray-500">
                      {style.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyEnvironmentStep;
