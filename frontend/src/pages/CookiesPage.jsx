import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Cookie } from "lucide-react";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";

const CookiesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gradient-to-r from-cyan-400 to-purple-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <Cookie className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Política de Cookies</h1>
          </div>

          <p className="text-gray-400 mb-8">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">¿Qué son las Cookies?</h2>
              <p className="text-gray-300 leading-relaxed">
                Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. 
                Nos ayudan a mejorar tu experiencia, analizar el uso del sitio y personalizar el contenido.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">Cómo Utilizamos las Cookies</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                ColabLearn utiliza cookies para los siguientes propósitos:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li><strong>Esenciales:</strong> Necesarias para el funcionamiento básico del sitio, como la autenticación y seguridad.</li>
                <li><strong>Funcionales:</strong> Recuerdan tus preferencias y configuraciones para mejorar tu experiencia.</li>
                <li><strong>Analíticas:</strong> Nos ayudan a entender cómo los usuarios interactúan con nuestra plataforma.</li>
                <li><strong>Marketing:</strong> Se usan para mostrar contenido relevante y medir la efectividad de nuestras campañas.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">Control de Cookies</h2>
              <p className="text-gray-300 leading-relaxed">
                Puedes controlar y gestionar las cookies a través de la configuración de tu navegador. Ten en cuenta que 
                desactivar ciertas cookies puede afectar la funcionalidad de la plataforma. Puedes configurar tu navegador 
                para rechazar cookies o para alertarte cuando se envíen cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">Cookies de Terceros</h2>
              <p className="text-gray-300 leading-relaxed">
                Algunos servicios de terceros que utilizamos pueden colocar cookies en tu dispositivo. Estos servicios nos 
                ayudan a analizar el tráfico, proporcionar funciones sociales y mostrar anuncios relevantes. No tenemos 
                control sobre estas cookies de terceros.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">Más Información</h2>
              <p className="text-gray-300 leading-relaxed">
                Para obtener más información sobre cómo gestionamos tus datos, consulta nuestra{" "}
                <button 
                  onClick={() => navigate('/privacy')}
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  Política de Privacidad
                </button>.
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CookiesPage;

