import React from "react";
import { 
  Heart, MessageSquare, EyeOff, Trophy, Handshake, 
  ClipboardList, Droplet, Activity, Dumbbell, TrendingUp, 
  Clock, Users, Flame, BookOpen, Zap, MessageCircle, Briefcase 
} from "lucide-react";

const personalities = [
  {
    id: "extrovertido",
    label: "Extrovertido",
    icon: MessageSquare,
    description: "Me gusta hablar y socializar",
  },
  {
    id: "introvertido",
    label: "Introvertido",
    icon: EyeOff,
    description: "Prefiero espacios más íntimos",
  },
  {
    id: "competitivo",
    label: "Competitivo",
    icon: Trophy,
    description: "Me motiva la competencia sana",
  },
  {
    id: "colaborativo",
    label: "Colaborativo",
    icon: Handshake,
    description: "Prefiero trabajar en equipo",
  },
  {
    id: "organizado",
    label: "Organizado",
    icon: ClipboardList,
    description: "Me gusta la planificación",
  },
  {
    id: "flexible",
    label: "Flexible",
    icon: Droplet,
    description: "Me adapto fácilmente a cambios",
  },
  {
    id: "paciente",
    label: "Paciente",
    icon: Activity,
    description: "Bueno explicando y esperando",
  },
  {
    id: "motivador",
    label: "Motivador",
    icon: Dumbbell,
    description: "Me gusta animar a otros",
  },
];

const goals = [
  { id: "notas", label: "Mejorar Notas", icon: TrendingUp },
  { id: "habitos", label: "Crear Hábitos", icon: Clock },
  { id: "amigos", label: "Hacer Amigos", icon: Users },
  { id: "motivacion", label: "Mantener Motivación", icon: Flame },
  { id: "disciplina", label: "Aumentar Disciplina", icon: Dumbbell },
  { id: "examenes", label: "Preparar Exámenes", icon: BookOpen },
];

const PersonalityStep = ({ setPreferences, handleMultiSelect, preferences }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Heart className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Tu Personalidad
        </h2>
        <p className="text-gray-600">
          Ayúdanos a conocerte mejor para encontrar compañeros compatibles
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            ¿Cómo te describes? (elige las que más te representen)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {personalities.map((personality) => (
              <button
                key={personality.id}
                onClick={() => handleMultiSelect("personality", personality.id)}
                className={`p-4 border-2 rounded-xl transition-all text-left ${
                  preferences.personality.includes(personality.id)
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {React.createElement(personality.icon, { className: "w-6 h-6 text-purple-600" })}
                  <div>
                    <div className="font-semibold">{personality.label}</div>
                    <div className="text-sm text-gray-500">
                      {personality.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Estilo de comunicación
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                value: "directo",
                label: "Directo",
                desc: "Voy al grano",
                icon: Zap,
              },
              {
                value: "amigable",
                label: "Amigable",
                desc: "Me gusta conversar",
                icon: MessageCircle,
              },
              {
                value: "formal",
                label: "Formal",
                desc: "Profesional",
                icon: Briefcase,
              },
            ].map((style) => {
              const IconComponent = style.icon;
              return (
                <button
                  key={style.value}
                  onClick={() =>
                    setPreferences((prev) => ({
                      ...prev,
                      communicationStyle: style.value,
                    }))
                  }
                  className={`p-4 border-2 rounded-xl transition-all text-center ${
                    preferences.communicationStyle === style.value
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="font-semibold">{style.label}</div>
                  <div className="text-sm text-gray-500">{style.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Cuentanos sobre ti
          </label>
          <textarea
            value={preferences.bio || ""}
            onChange={(e) =>
              setPreferences((prev) => ({
                ...prev,
                bio: e.target.value,
              }))
            }
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus :border-purple-300 focus:outline-none transition-all"
            placeholder="Escribe algo sobre ti, tus intereses, hobbies..."
            rows="4"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            ¿Cuáles son tus principales objetivos? (puedes elegir varios)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {goals.map((goal) => {
              const IconComponent = goal.icon;
              return (
                <button
                  key={goal.id}
                  onClick={() => handleMultiSelect("goals", goal.id)}
                  className={`p-4 border-2 rounded-xl transition-all text-center ${
                    preferences.goals.includes(goal.id)
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="font-semibold text-sm">{goal.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
export default PersonalityStep;
