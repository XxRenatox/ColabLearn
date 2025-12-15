import React, { useState, useEffect } from "react";
import { Menu, X, Users, Check, Trophy, Target, Flame } from "lucide-react";
import Header from "../layout/Header";

// Componente Hero con el estilo mejorado
const Hero = ({ isAuthenticated, onAuthAction }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [progressAnimation, setProgressAnimation] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressAnimation(65);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-gray-900 text-white flex flex-col overflow-hidden relative">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 right-20 w-40 h-40 bg-purple-400 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-indigo-400 rounded-full blur-2xl"></div>
      </div>

      {/* Header */}
      <Header />

      {/* Hero Content */}
      <main className="flex flex-col md:flex-row items-center justify-between flex-1 px-6 md:px-10 py-16 gap-12 relative z-10">
        <div className="max-w-lg space-y-6 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Estudia.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              Colabora.
            </span>{" "}
            Triunfa.
          </h1>

          <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
            Únete a miles de estudiantes, comparte recursos y logra tus metas
            con ColabLearn.
            <span className="text-cyan-400 font-medium">
              {" "}
              La plataforma de estudio más innovadora.
            </span>
          </p>

          <div className="flex items-center gap-6 justify-center md:justify-start text-sm">
            <div className="flex items-center gap-2">
              <Users className="text-cyan-400" size={18} />
              <span className="text-gray-300">50,000+ estudiantes activos</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
            <button 
              onClick={onAuthAction}
              className="px-8 py-4 rounded-2xl font-semibold text-lg shadow-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 transform hover:scale-105 hover:shadow-purple-500/25"
            >
              {isAuthenticated ? "Ir al Dashboard" : "Comenzar Gratis"}
            </button>
          </div>

          <ul className="space-y-3 mt-8">
            <li className="flex items-center gap-3 text-gray-300 justify-center md:justify-start group">
              <div className="p-1 rounded-full bg-green-400/20 group-hover:bg-green-400/30 transition-colors duration-300">
                <Check className="text-green-400" size={18} />
              </div>
              <span className="group-hover:text-white transition-colors duration-300">
                Grupos de estudio ilimitados
              </span>
            </li>
            <li className="flex items-center gap-3 text-gray-300 justify-center md:justify-start group">
              <div className="p-1 rounded-full bg-green-400/20 group-hover:bg-green-400/30 transition-colors duration-300">
                <Check className="text-green-400" size={18} />
              </div>
              <span className="group-hover:text-white transition-colors duration-300">
                Herramientas con IA avanzada
              </span>
            </li>
            <li className="flex items-center gap-3 text-gray-300 justify-center md:justify-start group">
              <div className="p-1 rounded-full bg-green-400/20 group-hover:bg-green-400/30 transition-colors duration-300">
                <Check className="text-green-400" size={18} />
              </div>
              <span className="group-hover:text-white transition-colors duration-300">
                Comunidad global activa
              </span>
            </li>
          </ul>
        </div>

        <div className="relative w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-sm text-gray-800 rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Progreso de Estudio</h3>
              <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-2 rounded-full">
                <Trophy className="text-indigo-600" size={20} />
              </div>
            </div>

            <p className="text-gray-600 mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Completa tus metas diarias y gana recompensas
            </p>

            <div className="bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-4 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ width: `${progressAnimation}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500 font-medium">
                {progressAnimation}% completado
              </p>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-bold text-orange-600">
                  7 días seguidos
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  ¡Nuevo logro desbloqueado!
                </span>
              </div>
            </div>
          </div>

          <div className="absolute -top-6 -right-6 bg-gradient-to-r from-yellow-400 to-orange-400 text-black rounded-full p-4 shadow-2xl animate-bounce">
            <Trophy size={28} />
          </div>

          <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-2xl px-4 py-2 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span className="text-sm font-medium">+15 puntos hoy</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Hero;