import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Facebook, Twitter, Instagram, MessageCircle, Mail, ExternalLink, Heart } from "lucide-react";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Función para manejar navegación
  const handleNavigation = (path) => {
    if (path.startsWith('http')) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else if (path.startsWith('#')) {
      // Manejo de anchor links
      if (location.pathname === '/') {
        // Si estamos en la landing page, solo hacemos scroll
        const element = document.querySelector(path);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        // Si no estamos en la landing, navegamos primero a "/" y luego hacemos scroll
        navigate('/');
        setTimeout(() => {
          const element = document.querySelector(path);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    } else {
      navigate(path);
    }
  };

  return (
  <footer className="bg-gradient-to-br from-gray-900 to-black text-white py-16 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-cyan-900/10"></div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="grid md:grid-cols-5 gap-12 mb-12">
        <div className="md:col-span-2">
          <div className="flex items-center space-x-3 mb-6">
            <img 
              src="/logo.svg" 
              alt="ColabLearn Logo" 
              className="h-12 w-auto"
            />
            <span className="text-3xl font-bold">ColabLearn</span>
          </div>
          <p className="text-gray-400 text-lg leading-relaxed mb-6">
            La red social de estudio que conecta estudiantes brillantes de todo
            el mundo. Transforma tu experiencia académica con la comunidad más
            motivada del planeta.
          </p>
          <div className="flex space-x-4">
            <a
              href="https://facebook.com/colablearn"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center hover:scale-110 cursor-pointer transition-all duration-300"
              aria-label="Síguenos en Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com/colablearn"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center hover:scale-110 cursor-pointer transition-all duration-300"
              aria-label="Síguenos en Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://instagram.com/colablearn"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gradient-to-r from-pink-600 to-rose-500 rounded-full flex items-center justify-center hover:scale-110 cursor-pointer transition-all duration-300"
              aria-label="Síguenos en Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://wa.me/1234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-500 rounded-full flex items-center justify-center hover:scale-110 cursor-pointer transition-all duration-300"
              aria-label="Contáctanos por WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-6 text-purple-400">Producto</h4>
          <div className="space-y-3 text-gray-400">
            <button
              onClick={() => handleNavigation('#how-it-works')}
              className="block hover:text-cyan-400 transition-colors hover:translate-x-1 transform duration-300 text-left"
              aria-label="Ver cómo funciona ColabLearn"
            >
              Cómo Funciona
            </button>
            <button
              onClick={() => handleNavigation('#stats')}
              className="block hover:text-cyan-400 transition-colors hover:translate-x-1 transform duration-300 text-left"
              aria-label="Ver estadísticas de ColabLearn"
            >
              Comunidad
            </button>
            <button
              onClick={() => handleNavigation('#testimonials')}
              className="block hover:text-cyan-400 transition-colors hover:translate-x-1 transform duration-300 text-left"
              aria-label="Ver testimonios"
            >
              Testimonios
            </button>
            <a
              href="https://docs.colablearn.com/api"
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:text-cyan-400 transition-colors hover:translate-x-1 transform duration-300"
              aria-label="API para Desarrolladores (se abre en nueva pestaña)"
            >
              API para Desarrolladores
              <ExternalLink className="inline w-3 h-3 ml-1" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-6 text-blue-400">Soporte</h4>
          <div className="space-y-3 text-gray-400">
            <button
              onClick={() => handleNavigation('/contact')}
              className="block hover:text-cyan-400 transition-colors hover:translate-x-1 transform duration-300 text-left"
              aria-label="Página de contacto"
            >
              Contacto
            </button>
            <a
              href="https://status.colablearn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:text-cyan-400 transition-colors hover:translate-x-1 transform duration-300"
              aria-label="Estado del Servicio (se abre en nueva pestaña)"
            >
              Estado del Servicio
              <ExternalLink className="inline w-3 h-3 ml-1" />
            </a>
            <a
              href="https://blog.colablearn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:text-cyan-400 transition-colors hover:translate-x-1 transform duration-300"
              aria-label="Blog de Educación (se abre en nueva pestaña)"
            >
              Blog
              <ExternalLink className="inline w-3 h-3 ml-1" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-6 text-green-400">Empresa</h4>
          <div className="space-y-3 text-gray-400">
            <button
              onClick={() => handleNavigation('/about')}
              className="block hover:text-cyan-400 transition-colors hover:translate-x-1 transform duration-300 text-left"
              aria-label="Conoce más sobre ColabLearn"
            >
              Acerca de Nosotros
            </button>
            <a
              href="https://blog.colablearn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:text-cyan-400 transition-colors hover:translate-x-1 transform duration-300"
              aria-label="Blog de Educación (se abre en nueva pestaña)"
            >
              Blog
              <ExternalLink className="inline w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-gray-400 flex items-center gap-1 flex-wrap">
            &copy; 2025 ColabLearn. Todos los derechos reservados. Hecho con <Heart className="w-4 h-4 text-red-400 inline" /> para estudiantes.
          </p>
          <div className="flex items-center space-x-8 text-gray-400 text-sm">
            <button
              onClick={() => handleNavigation('/terms')}
              className="hover:text-cyan-400 transition-colors"
              aria-label="Leer términos de uso"
            >
              Términos de Uso
            </button>
            <button
              onClick={() => handleNavigation('/privacy')}
              className="hover:text-cyan-400 transition-colors"
              aria-label="Leer política de privacidad"
            >
              Política de Privacidad
            </button>
            <button
              onClick={() => handleNavigation('/cookies')}
              className="hover:text-cyan-400 transition-colors"
              aria-label="Información sobre cookies"
            >
              Cookies
            </button>
            <button
              onClick={() => handleNavigation('/security')}
              className="hover:text-cyan-400 transition-colors"
              aria-label="Información de seguridad"
            >
              Seguridad
            </button>
          </div>
        </div>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
