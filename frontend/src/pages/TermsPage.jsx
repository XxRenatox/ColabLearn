import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";

const TermsPage = () => {
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
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Términos de Uso</h1>
          </div>

          <p className="text-gray-400 mb-8">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">1. Aceptación de los Términos</h2>
              <p className="text-gray-300 leading-relaxed">
                Al acceder y utilizar ColabLearn, aceptas cumplir con estos Términos de Uso. Si no estás de acuerdo 
                con alguna parte de estos términos, no debes utilizar nuestra plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">2. Descripción del Servicio</h2>
              <p className="text-gray-300 leading-relaxed">
                ColabLearn es una plataforma educativa que conecta a estudiantes para facilitar el aprendizaje colaborativo, 
                la organización de grupos de estudio, sesiones de aprendizaje y el intercambio de recursos académicos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">3. Registro y Cuenta de Usuario</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Para utilizar ColabLearn, debes crear una cuenta proporcionando información precisa y completa. Eres responsable de:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Mantener la confidencialidad de tu contraseña</li>
                <li>Toda la actividad que ocurra bajo tu cuenta</li>
                <li>Notificarnos inmediatamente sobre cualquier uso no autorizado</li>
                <li>Proporcionar información veraz y actualizada</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">4. Uso Aceptable</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Te comprometes a utilizar ColabLearn de manera responsable y legal. Está prohibido:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Compartir contenido ilegal, ofensivo o inapropiado</li>
                <li>Harassment, acoso o intimidación a otros usuarios</li>
                <li>Violar derechos de propiedad intelectual</li>
                <li>Intentar acceder a áreas restringidas o vulnerar la seguridad</li>
                <li>Usar la plataforma para fines comerciales no autorizados</li>
                <li>Interferir con el funcionamiento de la plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">5. Contenido del Usuario</h2>
              <p className="text-gray-300 leading-relaxed">
                Retienes la propiedad del contenido que publicas en ColabLearn. Al publicar contenido, nos otorgas una 
                licencia no exclusiva para usar, mostrar y distribuir ese contenido en nuestra plataforma. Eres responsable 
                del contenido que compartes y garantizas que tienes los derechos necesarios para hacerlo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">6. Propiedad Intelectual</h2>
              <p className="text-gray-300 leading-relaxed">
                Todos los derechos de propiedad intelectual de ColabLearn, incluidos diseños, logotipos, textos y código, 
                son propiedad de ColabLearn o sus licenciantes. No puedes copiar, modificar o distribuir nuestro contenido 
                sin autorización previa por escrito.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">7. Limitación de Responsabilidad</h2>
              <p className="text-gray-300 leading-relaxed">
                ColabLearn se proporciona "tal cual" sin garantías de ningún tipo. No garantizamos que la plataforma 
                esté libre de errores o interrupciones. No seremos responsables por daños indirectos, incidentales o 
                consecuentes derivados del uso de nuestra plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">8. Modificaciones del Servicio</h2>
              <p className="text-gray-300 leading-relaxed">
                Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto de ColabLearn en 
                cualquier momento, con o sin previo aviso. No seremos responsables ante ti o terceros por cualquier 
                modificación, suspensión o discontinuación.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">9. Terminación</h2>
              <p className="text-gray-300 leading-relaxed">
                Podemos terminar o suspender tu cuenta inmediatamente, sin previo aviso, por violación de estos términos 
                o por cualquier otra razón que consideremos apropiada. Puedes terminar tu cuenta en cualquier momento 
                contactándonos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">10. Contacto</h2>
              <p className="text-gray-300 leading-relaxed">
                Si tienes preguntas sobre estos Términos de Uso, puedes contactarnos a través de nuestra página de 
                contacto o enviando un correo electrónico a legal@colablearn.com
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermsPage;

