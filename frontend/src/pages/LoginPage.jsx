import React, { useState, useEffect } from "react";
import { BookOpen, Users, Star, CheckCircle } from "lucide-react";
import LoginForm from "../components/ui/forms/LoginForm";
import RegisterForm from "../components/ui/forms/RegisterForm";
import Footer from "../components/layout/Footer";
import { TestimonialCard } from "../components/ui/Card";
import { useNavigate } from "react-router-dom";
import { Modal } from "../components/ui/Modal";
import { useApp } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { getAuthToken, clearAuthToken } from "../services/tokenManager";
import { needsPreferences, validateLoginInput, validateRegisterInput } from "../utils/userUtils";
import { api } from "@/services/api";
import { useToast } from "@/components/ui/Toast";

// Ya está importado useToast, solo necesitamos usarlo

export default function ColabLearnAuth() {
  const [currentView, setCurrentView] = useState("login");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, type: "success", title: "", message: "" });

  const initialLoginData = { email: "", password: "" };
  const initialRegisterData = {
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    agreeToTerms: false,
  };

  const [loginData, setLoginData] = useState(initialLoginData);
  const [registerData, setRegisterData] = useState(initialRegisterData);

  const navigate = useNavigate();
  const { login, register } = useApp();
  const { isAuthenticated: authIsAuthenticated, currentUser: authUser, loading: authLoading } = useAuth();
  const { addToast, error: showError } = useToast();

  // Verificar si el usuario ya está autenticado al cargar la página
  useEffect(() => {
    const checkExistingAuth = async () => {
      const token = getAuthToken();

      if (!token) {
        setCheckingAuth(false);
        return;
      }

      // Si hay token, verificar si es válido (silenciosamente)
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/auth/me');
        const userData = response.data?.data?.user || response.data?.user || null;

        if (userData) {
          // Token válido, redirigir según el rol
          if (userData.role === 'admin') {
            navigate("/admin", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        } else {
          // Token inválido, limpiar silenciosamente
          clearAuthToken();
          delete api.defaults.headers.common['Authorization'];
          setCheckingAuth(false);
        }
      } catch (error) {
        // Si es error 401, el token es inválido, limpiar silenciosamente
        if (error.response?.status === 401) {
          clearAuthToken();
          delete api.defaults.headers.common['Authorization'];
        }
        // Continuar normalmente sin mostrar errores
        setCheckingAuth(false);
      }
    };

    // Solo verificar si no estamos ya en proceso de logout
    checkExistingAuth();
  }, [navigate]);

  // También verificar cuando cambie el estado de autenticación
  useEffect(() => {
    if (!authLoading && (authIsAuthenticated || authUser)) {
      const user = authUser || (authIsAuthenticated ? {} : null);
      if (user?.role === 'admin') {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [authIsAuthenticated, authUser, authLoading, navigate]);

  // Mostrar mensaje de cuenta desactivada si existe
  useEffect(() => {
    const deactivationMessage = sessionStorage.getItem('account_deactivated_message');
    if (deactivationMessage) {
      sessionStorage.removeItem('account_deactivated_message');
      showError(
        'Cuenta Desactivada',
        deactivationMessage,
        { duration: 8000 }
      );
    }
  }, [showError]);

  // Handlers de cambio
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

  const handleRegisterChange = (e) => {
    const { name, type, value, checked } = e.target;
    setRegisterData({
      ...registerData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar entrada
      const validation = validateLoginInput(loginData);
      if (!validation.valid) {
        setFeedback({
          open: true,
          type: "error",
          title: "Datos inválidos",
          message: validation.errors.join(", ")
        });
        setLoading(false);
        return;
      }

      // Usar la función login del Context
      const credentials = {
        email: validation.data.email, // Usar email validado
        password: loginData.password
      };

      const response = await login(credentials);

      setFeedback({
        open: true,
        type: "success",
        title: "¡Bienvenido!",
        message: "Inicio de sesión exitoso"
      });

      setLoginData(initialLoginData);

      // Redirigir inmediatamente después del login exitoso según el rol
      if (response?.role === 'admin') {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }

    } catch (err) {
      console.error('Login error:', err);

      // Verificar si es un error de cuenta desactivada
      const isAccountDeactivated = err.response?.status === 403 &&
        (err.response?.data?.message?.toLowerCase().includes('cuenta desactivada') ||
          err.response?.data?.message?.toLowerCase().includes('desactivada'));

      // Extraer el mensaje de error del backend
      const backendMessage = err.response?.data?.message ||
        err.response?.data?.error ||
        err.message;

      const errorTitle = isAccountDeactivated ? 'Cuenta Desactivada' : 'No pudimos iniciar sesión';
      const errorMessage = isAccountDeactivated
        ? (err.response?.data?.message || 'Tu cuenta ha sido desactivada por un administrador. Por favor, contacta al soporte si crees que esto es un error.')
        : (backendMessage || "Error de conexión. Intenta nuevamente.");

      setFeedback({
        open: true,
        type: "error",
        title: errorTitle,
        message: errorMessage
      });

      // También mostrar toast para cuenta desactivada
      if (isAccountDeactivated) {
        showError(
          errorTitle,
          errorMessage,
          { duration: 8000 }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validar y preparar payload para backend
      const validation = validateRegisterInput(registerData);
      if (!validation.valid) {
        setFeedback({
          open: true,
          type: "error",
          title: "Datos inválidos",
          message: validation.errors.join("\n"),
        });
        setLoading(false);
        return;
      }

      const payload = validation.data; // { email, password, name, avatar }
      const data = await register(payload);

      if (!data.success) {
        setFeedback({
          open: true,
          type: "error",
          title: "Error en registro",
          message: data.message || "Error al crear la cuenta"
        });
        setLoading(false);
        return;
      }

      setFeedback({
        open: true,
        type: "success",
        title: "¡Cuenta creada!",
        message: "Registro exitoso. Redirigiendo..."
      });
      setRegisterData(initialRegisterData);

      const navState = {
        user: data.data.user,
        token: data.data.token,
        supabaseSession: data.data.supabaseSession,
      };

      // Pequeño delay para mostrar el mensaje de éxito
      setTimeout(() => {
        navigate("/preferences", { state: navState });
      }, 1000);
    } catch (err) {
      const errorMsg = err.message || err.response?.data?.error || "Error de conexión. Intenta nuevamente.";
      const errorDetails = err.errors ? '\n' + err.errors.map(e => e.message || e.msg).join('\n') : '';

      setFeedback({
        open: true,
        type: "error",
        title: "No pudimos crear tu cuenta",
        message: errorMsg + errorDetails
      });
    } finally {
      setLoading(false);
    }
  };

  // Modal de Olvidaste Contraseña
  const handleForgotPassword = () => {
    if (!loginData.email) {
      addToast('Por favor ingresa tu correo electrónico para recuperar tu contraseña', 'warning');
      return;
    }
    setForgotModalOpen(true);
  };

  // Features y testimonios
  const testimonials = [
    {
      content:
        "ColabLearn me ayudó a encontrar el grupo de estudio perfecto para Ingeniería.",
      name: "María González",
      role: "Ingeniería Civil - UC",
      avatar: "👩‍💻",
      rating: 5,
    },
  ];

  const features = [
    { icon: Users, text: "Conecta con +50,000 estudiantes" },
    { icon: Star, text: "Mejora tu rendimiento académico" },
    { icon: CheckCircle, text: "Gamificación y recompensas" },
  ];

  // Mostrar loading mientras se verifica la autenticación


  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-green-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 bg-pink-400/20 rounded-full blur-2xl animate-pulse delay-500"></div>

        <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side */}
          <div className="hidden lg:block text-white space-y-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <img src="/logo.svg" alt="ColabLearn" className="w-12 h-12" />
                <span className="text-3xl font-bold">ColabLearn</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-bold leading-tight">
                  Únete a la Revolución del
                  <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Estudio Colaborativo
                  </span>
                </h1>
                <p className="text-blue-100 text-lg">
                  Miles de estudiantes ya están mejorando su rendimiento
                  académico con ColabLearn.
                </p>
              </div>

              <div className="space-y-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Icon className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="text-blue-100">{feature.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <TestimonialCard testimonial={testimonials[0]} index={0} />
            </div>
          </div>

          {/* Right Side - Auth Forms */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="p-8 pb-0">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentView === "login"
                      ? "Bienvenido de vuelta"
                      : "Crea tu cuenta"}
                  </h2>
                  <p className="text-gray-600">
                    {currentView === "login"
                      ? "Inicia sesión para continuar estudiando"
                      : "Únete a miles de estudiantes exitosos"}
                  </p>
                </div>

                <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
                  <button
                    onClick={() => {
                      setCurrentView("login");
                      setLoginData(initialLoginData);
                    }}
                    className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${currentView === "login"
                      ? "bg-white text-blue-600 shadow-md transform scale-105"
                      : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView("register");
                      setRegisterData(initialRegisterData);
                    }}
                    className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${currentView === "register"
                      ? "bg-white text-blue-600 shadow-md transform scale-105"
                      : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Registro
                  </button>
                </div>
              </div>

              <div className="px-8 pb-8">
                {currentView === "login" ? (
                  <LoginForm
                    formData={loginData}
                    onChange={handleLoginChange}
                    onSubmit={handleLogin}
                    loading={loading}
                    onForgotPassword={handleForgotPassword}
                    onForgot={() => setForgotModalOpen(true)}
                  />
                ) : (
                  <RegisterForm
                    formData={registerData}
                    onChange={handleRegisterChange}
                    onSubmit={handleRegister}
                    loading={loading}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Olvidaste Contraseña */}
      <Modal isOpen={forgotModalOpen} onClose={() => setForgotModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recuperar Contraseña</h2>
          <p className="text-gray-600 mb-4">
            Ingresa tu correo electrónico para recibir un enlace de
            recuperación.
          </p>
          <input
            type="email"
            placeholder="Correo electrónico"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={loginData.email}
            onChange={(e) =>
              setLoginData({ ...loginData, email: e.target.value })
            }
          />
          <button
            onClick={() => {
              setFeedback({ open: true, type: "success", title: "Correo enviado", message: `Se ha enviado un enlace de recuperación a ${loginData.email}` });
              setForgotModalOpen(false);
            }}
            className="mt-4 w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-2 rounded-lg hover:from-green-500 hover:to-blue-600 transition-colors"
          >
            Enviar enlace de recuperación
          </button>
        </div>
      </Modal>

      {/* Modal de feedback genérico */}
      <Modal isOpen={feedback.open} onClose={() => setFeedback({ ...feedback, open: false })}>
        <div className="p-6">
          <h2 className={`text-lg font-semibold mb-2 ${feedback.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>{feedback.title}</h2>
          <p className="text-gray-700 whitespace-pre-line">{feedback.message}</p>
          <button
            onClick={() => setFeedback({ ...feedback, open: false })}
            className="mt-4 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg hover:from-purple-500 hover:to-indigo-500 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </Modal>

      <Footer />
    </>
  );
}
