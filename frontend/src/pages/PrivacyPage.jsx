import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";

const PrivacyPage = () => {
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
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Política de Privacidad</h1>
          </div>

          <p className="text-gray-400 mb-8">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">1. Información que Recopilamos</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Recopilamos información que nos proporcionas directamente cuando:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Creas una cuenta (nombre, email, contraseña)</li>
                <li>Completas tu perfil académico (universidad, carrera, materias)</li>
                <li>Participas en grupos de estudio o sesiones</li>
                <li>Contactas con nuestro equipo de soporte</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                También recopilamos información automáticamente, como tu dirección IP, tipo de navegador, páginas visitadas 
                y tiempo de uso.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">2. Cómo Usamos tu Información</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Utilizamos la información recopilada para:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Proporcionar y mejorar nuestros servicios</li>
                <li>Personalizar tu experiencia en la plataforma</li>
                <li>Conectarte con otros estudiantes con intereses similares</li>
                <li>Enviarte notificaciones importantes sobre tu cuenta</li>
                <li>Analizar el uso de la plataforma para mejoras</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">3. Compartir Información</h2>
              <p className="text-gray-300 leading-relaxed">
                No vendemos tu información personal. Podemos compartir información en las siguientes circunstancias:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mt-4">
                <li>Con otros usuarios de la plataforma cuando participas en grupos públicos</li>
                <li>Con proveedores de servicios que nos ayudan a operar la plataforma</li>
                <li>Cuando es requerido por ley o para proteger nuestros derechos</li>
                <li>En caso de transferencia de negocio (fusiones, adquisiciones)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">4. Seguridad de los Datos</h2>
              <p className="text-gray-300 leading-relaxed">
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal. 
                Sin embargo, ningún método de transmisión por Internet es 100% seguro. Te recomendamos usar contraseñas 
                fuertes y no compartir tus credenciales de acceso.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">5. Tus Derechos</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Tienes derecho a:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Acceder a tu información personal</li>
                <li>Corregir información inexacta</li>
                <li>Solicitar la eliminación de tu información</li>
                <li>Oponerte al procesamiento de tus datos</li>
                <li>Solicitar una copia de tus datos en formato portable</li>
                <li>Retirar tu consentimiento en cualquier momento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">6. Cookies y Tecnologías Similares</h2>
              <p className="text-gray-300 leading-relaxed">
                Utilizamos cookies y tecnologías similares para mejorar tu experiencia, analizar el tráfico del sitio 
                y personalizar el contenido. Puedes controlar el uso de cookies a través de la configuración de tu navegador. 
                Para más información, consulta nuestra Política de Cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">7. Retención de Datos</h2>
              <p className="text-gray-300 leading-relaxed">
                Conservamos tu información personal mientras tu cuenta esté activa o mientras sea necesario para 
                proporcionarte servicios. Cuando elimines tu cuenta, eliminaremos o anonimizaremos tu información, 
                excepto cuando la ley requiera que la conservemos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">8. Menores de Edad</h2>
              <p className="text-gray-300 leading-relaxed">
                ColabLearn está dirigido a estudiantes de todas las edades. Si eres menor de edad, te recomendamos 
                obtener el consentimiento de tus padres o tutores antes de usar nuestra plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">9. Cambios a esta Política</h2>
              <p className="text-gray-300 leading-relaxed">
                Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos sobre cambios 
                importantes mediante un aviso en la plataforma o por correo electrónico. Te recomendamos revisar 
                esta política periódicamente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">10. Contacto</h2>
              <p className="text-gray-300 leading-relaxed">
                Si tienes preguntas o inquietudes sobre esta Política de Privacidad o sobre cómo manejamos tus datos, 
                puedes contactarnos en privacy@colablearn.com
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPage;

