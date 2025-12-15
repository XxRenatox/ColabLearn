import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import React, { useState } from "react";

export default function LoginForm({
  onSubmit,
  formData,
  onChange,
  loading,
  onForgotPassword
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  // Validación básica
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'email':
        if (!value) newErrors.email = 'El correo electrónico es requerido';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value))
          newErrors.email = 'Formato de correo inválido';
        else delete newErrors.email;
        break;

      case 'password':
        if (!value) newErrors.password = 'La contraseña es requerida';
        else if (value.length < 6)
          newErrors.password = 'Debe tener al menos 6 caracteres';
        else delete newErrors.password;
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  // Manejadores
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(e);
    if (touched[name]) setTimeout(() => validateField(name, value), 250);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    validateField(name, value);
  };

  const isFormValid =
    Object.keys(errors).length === 0 &&
    formData.email &&
    formData.password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    validateField("email", formData.email);
    validateField("password", formData.password);
    if (isFormValid) {
      setIsValidating(true);
      try {
        await onSubmit(e);
      } finally {
        setIsValidating(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      {/* Email */}
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none z-10">
          <Mail className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full pl-11 pr-12 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 text-gray-900 ${
            errors.email && touched.email
              ? "border-red-500 focus:ring-red-500"
              : touched.email && !errors.email
              ? "border-green-500 focus:ring-green-500"
              : "border-gray-200 focus:ring-blue-500"
          }`}
          required
        />
        {touched.email && (
          <div className="absolute right-3 top-0 bottom-0 flex items-center pointer-events-none z-10">
            {errors.email ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </div>
        )}
        {errors.email && touched.email && (
          <p className="mt-1 text-sm text-red-600 animate-slide-in">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none z-10">
          <Lock className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full pl-11 pr-12 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 text-gray-900 ${
            errors.password && touched.password
              ? "border-red-500 focus:ring-red-500"
              : touched.password && !errors.password
              ? "border-green-500 focus:ring-green-500"
              : "border-gray-200 focus:ring-blue-500"
          }`}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-10 top-0 bottom-0 flex items-center text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
        {touched.password && (
          <div className="absolute right-3 top-0 bottom-0 flex items-center pointer-events-none z-10">
            {errors.password ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </div>
        )}
        {errors.password && touched.password && (
          <p className="mt-1 text-sm text-red-600 animate-slide-in">{errors.password}</p>
        )}
      </div>

      {/* Forgot password */}
      <div className="flex justify-end">
        <button
          type="button"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          onClick={onForgotPassword}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || isValidating || !isFormValid}
        className={`group w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-300 ${
          loading || isValidating || !isFormValid
            ? "bg-gray-400 text-gray-600 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:-translate-y-0.5 hover-glow"
        }`}
      >
        {loading || isValidating ? (
          <div className="flex items-center space-x-2">
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>{isValidating ? "Validando..." : "Iniciando sesión..."}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span>Iniciar Sesión</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </button>
    </form>
  );
}
