import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Target, Heart, Rocket } from "lucide-react";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";

const AboutPage = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: Users,
      title: "Comunidad",
      description: "Creemos en el poder del aprendizaje colaborativo y la construcción de comunidades académicas fuertes."
    },
    {
      icon: Target,
      title: "Excelencia",
      description: "Nos esforzamos por ofrecer herramientas y recursos de la más alta calidad para el éxito académico."
    },
    {
      icon: Heart,
      title: "Pasión",
      description: "Estamos apasionados por la educación y comprometidos con el crecimiento de cada estudiante."
    },
    {
      icon: Rocket,
      title: "Innovación",
      description: "Continuamente buscamos nuevas formas de mejorar la experiencia de aprendizaje."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Acerca de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              ColabLearn
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Transformando la forma en que los estudiantes aprenden, colaboran y alcanzan sus metas académicas.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10 mb-12">
          <h2 className="text-3xl font-bold mb-6 text-purple-400">Nuestra Misión</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            ColabLearn fue creado con la visión de democratizar el acceso a una educación colaborativa de calidad. 
            Creemos que cada estudiante merece la oportunidad de alcanzar su máximo potencial académico, y que el 
            aprendizaje es más efectivo cuando se hace en comunidad.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            Nuestra plataforma conecta a estudiantes de todo el mundo, facilitando la creación de grupos de estudio, 
            el intercambio de conocimientos y el apoyo mutuo en el camino hacia el éxito académico.
          </p>
        </div>

        {/* Values Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center text-purple-400">Nuestros Valores</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-r from-cyan-400 to-purple-500 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                      <p className="text-gray-300 leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* What We Offer Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10">
          <h2 className="text-3xl font-bold mb-6 text-purple-400">Lo que Ofrecemos</h2>
          <div className="space-y-4 text-gray-300">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-lg">
                <strong className="text-white">Grupos de Estudio:</strong> Conecta con estudiantes que comparten tus intereses académicos y objetivos de aprendizaje.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-lg">
                <strong className="text-white">Sesiones Organizadas:</strong> Programa y gestiona sesiones de estudio efectivas con herramientas integradas como Pomodoro y seguimiento de tiempo.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-lg">
                <strong className="text-white">Recursos Compartidos:</strong> Comparte y accede a materiales de estudio, notas y recursos educativos de calidad.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-lg">
                <strong className="text-white">Gamificación:</strong> Mantén la motivación con logros, puntos de experiencia y niveles que reconocen tu progreso.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-lg">
                <strong className="text-white">Matching Inteligente:</strong> Encuentra compañeros de estudio compatibles basados en tus preferencias académicas y horarios.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 text-center">
          <h2 className="text-3xl font-bold mb-4 text-purple-400">¿Quieres Saber Más?</h2>
          <p className="text-gray-300 text-lg mb-6">
            Estamos aquí para ayudarte. Si tienes preguntas o sugerencias, no dudes en contactarnos.
          </p>
          <button
            onClick={() => navigate("/contact")}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 transform hover:scale-105"
          >
            Contáctanos
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutPage;

