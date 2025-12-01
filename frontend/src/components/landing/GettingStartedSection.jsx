import React, { useState } from "react";
import {
  UserPlus,
  Search,
  Users,
  Calendar,
  Trophy,
  ArrowRight,
  CheckCircle,
  Play,
} from "lucide-react";

export default function GettingStartedSection() {
  const [activeDemo, setActiveDemo] = useState("profile");

  const demoSteps = {
    profile: {
      icon: UserPlus,
      title: "Crear Perfil",
      description: "Configura tu perfil académico personalizado",
      color: "blue",
      steps: [
        "Completa tu información básica",
        "Selecciona tu universidad y carrera",
        "Agrega tus materias de interés",
        "Define tus horarios disponibles",
      ],
    },
    connect: {
      icon: Search,
      title: "Conectar",
      description: "Encuentra y únete a grupos de estudio",
      color: "green",
      steps: [
        "Busca grupos por materia",
        "Revisa perfiles compatibles",
        "Envía solicitudes de unión",
        "Comienza a colaborar",
      ],
    },
    study: {
      icon: Calendar,
      title: "Estudiar",
      description: "Organiza sesiones de estudio efectivas",
      color: "yellow",
      steps: [
        "Programa sesiones grupales",
        "Usa técnicas de estudio probadas",
        "Comparte recursos y notas",
        "Gana XP por cada sesión",
      ],
    },
  };

  const steps = [
    {
      number: 1,
      icon: UserPlus,
      title: "Crea tu Perfil",
      description: "Regístrate gratis y completa tu perfil académico",
      details: [
        "Información básica y universidad",
        "Materias de interés",
        "Horarios disponibles",
        "Metas de estudio",
      ],
      color: "blue",
    },
    {
      number: 2,
      icon: Search,
      title: "Explora y Conecta",
      description: "Encuentra grupos y compañeros afines a tus estudios",
      details: [
        "Busca por materia o universidad",
        "Revisa perfiles compatibles",
        "Únete a grupos existentes",
        "Crea tu propio grupo",
      ],
      color: "green",
    },
    {
      number: 3,
      icon: Calendar,
      title: "Programa Sesiones",
      description: "Organiza sesiones de estudio efectivas",
      details: [
        "Coordina horarios con el grupo",
        "Establece objetivos claros",
        "Usa técnicas como Pomodoro",
        "Programa recordatorios",
      ],
      color: "purple",
    },
    {
      number: 4,
      icon: Trophy,
      title: "Alcanza tus Metas",
      description: "Mantente motivado y celebra tus logros",
      details: [
        "Gana XP por cada sesión",
        "Desbloquea logros únicos",
        "Sube de nivel constantemente",
        "Comparte tus éxitos",
      ],
      color: "yellow",
    },
  ];

  const benefits = [
    "Mejora tu rendimiento académico",
    "Encuentra compañeros de estudio compatibles",
    "Mantente motivado con gamificación",
    "Organiza mejor tu tiempo de estudio",
    "Accede a recursos compartidos",
    "Desarrolla habilidades colaborativas",
  ];

  return (
    <>
      <section
        id="how-it-works"
        className="py-24 bg-gradient-to-br from-indigo-900 via-indigo-900 to-emerald-700 relative overflow-hidden"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-purple-400 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-6 py-2 text-blue-700 font-medium mb-6">
              <Play className="w-5 h-5 mr-2" />
              Descubre Cómo Funciona
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Tu Éxito Académico en
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                {" "}
                3 Simples Pasos
              </span>
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Únete a miles de estudiantes que ya están transformando su forma
              de estudiar con ColabLearn
            </p>
          </div>

          {/* Demo Navigation */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Demo Tabs */}
            <div className="lg:w-1/3">
              <div className="space-y-4">
                {Object.entries(demoSteps).map(([key, demo]) => {
                  const Icon = demo.icon;
                  const isActive = activeDemo === key;

                  return (
                    <button
                      key={key}
                      onClick={() => setActiveDemo(key)}
                      className={`w-full text-left p-6 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-white shadow-lg border-2 border-blue-200"
                          : "bg-white hover:shadow-md border border-gray-200"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-3 rounded-lg ${
                            demo.color === "blue"
                              ? "bg-blue-100 text-blue-600"
                              : demo.color === "green"
                              ? "bg-green-100 text-green-600"
                              : "bg-yellow-100 text-yellow-600"
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {demo.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {demo.description}
                          </p>
                        </div>
                        {isActive && (
                          <ArrowRight className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Demo Content */}
            <div className="lg:w-2/3">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    {React.createElement(demoSteps[activeDemo].icon, {
                      className: `w-8 h-8 ${
                        demoSteps[activeDemo].color === "blue"
                          ? "text-blue-600"
                          : demoSteps[activeDemo].color === "green"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`,
                    })}
                    <h3 className="text-2xl font-bold text-gray-900">
                      {demoSteps[activeDemo].title}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-lg">
                    {demoSteps[activeDemo].description}
                  </p>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                  {demoSteps[activeDemo].steps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                          demoSteps[activeDemo].color === "blue"
                            ? "bg-blue-600"
                            : demoSteps[activeDemo].color === "green"
                            ? "bg-green-600"
                            : "bg-yellow-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    <Play className="w-4 h-4 mr-2" />
                    Probar Ahora Gratis
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Comienza en 4 Simples Pasos
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Te guiamos paso a paso para que aproveches al máximo ColabLearn
              desde el primer día
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={index} className="relative">
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent z-0" />
                  )}

                  <div className="relative bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    {/* Step Number */}
                    <div
                      className={`absolute -top-4 -left-4 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        step.color === "blue"
                          ? "bg-blue-600"
                          : step.color === "green"
                          ? "bg-green-600"
                          : step.color === "purple"
                          ? "bg-purple-600"
                          : "bg-yellow-600"
                      }`}
                    >
                      {step.number}
                    </div>

                    {/* Icon */}
                    <div
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                        step.color === "blue"
                          ? "bg-blue-100 text-blue-600"
                          : step.color === "green"
                          ? "bg-green-100 text-green-600"
                          : step.color === "purple"
                          ? "bg-purple-100 text-purple-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{step.description}</p>

                    {/* Details */}
                    <ul className="space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <li
                          key={detailIndex}
                          className="flex items-start space-x-2 text-sm text-gray-500"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Benefits Section */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  ¿Por qué elegir ColabLearn?
                </h3>
                <p className="text-gray-600 mb-6">
                  Únete a miles de estudiantes que ya están mejorando su
                  experiencia académica
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center lg:text-right">
                <div className="inline-block bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                  <h4 className="text-3xl font-bold mb-2">¡Es Gratis!</h4>
                  <p className="text-blue-100 mb-6">
                    Todas las funciones principales sin costo
                  </p>
                  <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center">
                    Comenzar Ahora
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
