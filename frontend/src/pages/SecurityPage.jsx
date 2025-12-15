import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Key, Eye, AlertTriangle } from "lucide-react";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";

const SecurityPage = () => {
  const navigate = useNavigate();

  const securityFeatures = [
    {
      icon: Lock,
      title: "Encriptación de Datos",
      description: "Toda la información sensible se transmite y almacena utilizando encriptación de extremo a extremo."
    },
    {
      icon: Key,
      title: "Autenticación Segura",
      description: "Implementamos métodos de autenticación robustos para proteger tu cuenta de accesos no autorizados."
    },
    {
      icon: Shield,
      title: "Monitoreo Continuo",
      description: "Nuestros sistemas monitorean constantemente la plataforma para detectar y prevenir amenazas."
    },
    {
      icon: Eye,
      title: "Control de Acceso",
      description: "Tienes control total sobre quién puede ver tu información y contenido personal."
    }
  ];

  const bestPractices = [
    "Usa contraseñas fuertes y únicas que no compartas con nadie",
    "Habilita la autenticación de dos factores si está disponible",
    "No compartas tus credenciales de acceso",
    "Cierra sesión cuando uses dispositivos compartidos",
    "Mantén tu navegador y sistema operativo actualizados",
    "Revisa regularmente la actividad de tu cuenta",
    "Ten cuidado con enlaces sospechosos o correos no solicitados"
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

        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-cyan-400 to-purple-500 w-16 h-16 rounded-xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold">Seguridad</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Tu seguridad y privacidad son nuestra máxima prioridad. Descubre cómo protegemos tu información.
          </p>
        </div>

        {/* Security Features */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
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
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Best Practices */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <h2 className="text-3xl font-bold text-purple-400">Buenas Prácticas de Seguridad</h2>
          </div>
          <p className="text-gray-300 mb-6 leading-relaxed">
            Ayúdanos a proteger tu cuenta siguiendo estas recomendaciones:
          </p>
          <ul className="space-y-3">
            {bestPractices.map((practice, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-300">{practice}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Data Protection */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10">
          <h2 className="text-3xl font-bold mb-6 text-purple-400">Protección de Datos</h2>
          <div className="space-y-4 text-gray-300">
            <p className="leading-relaxed">
              Implementamos múltiples capas de seguridad para proteger tu información personal y académica:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Encriptación SSL/TLS para todas las comunicaciones</li>
              <li>Almacenamiento seguro de contraseñas con hash</li>
              <li>Copias de seguridad regulares de los datos</li>
              <li>Acceso restringido a información sensible</li>
              <li>Auditorías de seguridad periódicas</li>
            </ul>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-12 text-center">
          <p className="text-gray-300 mb-4">
            ¿Encontraste una vulnerabilidad de seguridad o tienes preguntas sobre nuestra seguridad?
          </p>
          <button
            onClick={() => navigate("/contact")}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 transform hover:scale-105"
          >
            Reportar un Problema
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SecurityPage;

