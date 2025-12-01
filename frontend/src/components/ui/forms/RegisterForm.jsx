import { 
  Mail, Lock, User, Eye, EyeOff, ArrowRight, 
  AlertCircle, CheckCircle, HelpCircle, Check, X 
} from "lucide-react";
import React, { useState, useCallback } from "react";

// ✅ Debounce helper
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// ✅ Password strength meter
const getPasswordStrength = (password) => {
  if (!password) return 0;
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  return Math.min(strength, 5);
};

// ✅ Password requirements list
const PasswordRequirements = ({ password }) => {
  const requirements = [
    { text: 'Mínimo 8 caracteres', validate: (pwd) => pwd.length >= 8 },
    { text: 'Al menos una minúscula', validate: (pwd) => /[a-z]/.test(pwd) },
    { text: 'Al menos una mayúscula', validate: (pwd) => /[A-Z]/.test(pwd) },
    { text: 'Al menos un número', validate: (pwd) => /[0-9]/.test(pwd) },
    { text: 'Al menos un símbolo', validate: (pwd) => /[^A-Za-z0-9]/.test(pwd) },
  ];

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
      <div className="font-medium mb-2 text-gray-700 flex items-center">
        <HelpCircle className="w-4 h-4 mr-1" />
        Requisitos de la contraseña:
      </div>
      <ul className="space-y-1">
        {requirements.map((req, i) => (
          <li key={i} className={`flex items-center ${req.validate(password) ? 'text-green-600' : 'text-gray-500'}`}>
            {req.validate(password) ? <Check className="w-4 h-4 mr-1" /> : <X className="w-4 h-4 mr-1" />}
            {req.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ✅ Register form
export default function RegisterForm({ onSubmit, formData, onChange, loading }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  // --- Validation ---
  const validateField = useCallback((name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'firstName':
        if (!value) newErrors.firstName = 'El nombre es requerido';
        else if (value.length < 2) newErrors.firstName = 'Debe tener al menos 2 caracteres';
        else if (!/^[a-zA-ZÀ-ÿ\u00f1\u00d1'`\-\s]+$/.test(value))
          newErrors.firstName = 'Solo puede contener letras';
        else delete newErrors.firstName;
        break;

      case 'lastName':
        if (!value) newErrors.lastName = 'El apellido es requerido';
        else if (value.length < 2) newErrors.lastName = 'Debe tener al menos 2 caracteres';
        else if (!/^[a-zA-ZÀ-ÿ\u00f1\u00d1'`\-\s]+$/.test(value))
          newErrors.lastName = 'Solo puede contener letras';
        else delete newErrors.lastName;
        break;

      case 'email':
        if (!value) newErrors.email = 'El correo es requerido';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value))
          newErrors.email = 'Formato inválido';
        else delete newErrors.email;
        break;

      case 'password':
        if (!value) newErrors.password = 'La contraseña es requerida';
        else if (value.length < 8)
          newErrors.password = 'Debe tener al menos 8 caracteres';
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(value))
          newErrors.password = 'Debe tener mayúscula, minúscula, número y símbolo';
        else delete newErrors.password;
        break;

      case 'confirmPassword':
        if (!value) newErrors.confirmPassword = 'Confirma tu contraseña';
        else if (value !== formData.password)
          newErrors.confirmPassword = 'Las contraseñas no coinciden';
        else delete newErrors.confirmPassword;
        break;

      case 'agreeToTerms':
        if (!value) newErrors.agreeToTerms = 'Debes aceptar los términos';
        else delete newErrors.agreeToTerms;
        break;

      default:
        break;
    }

    setErrors(newErrors);
  }, [errors, formData.password]);

  const debouncedValidation = useCallback(debounce((name, value) => {
    validateField(name, value);
  }, 300), [validateField]);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    onChange({ target: { name, value: fieldValue } });
    if (!touched[name]) setTouched({ ...touched, [name]: true });
    debouncedValidation(name, fieldValue);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    validateField(name, value);
  };

  const isFormValid =
    Object.keys(errors).length === 0 &&
    formData.firstName?.length >= 2 &&
    formData.lastName?.length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
    formData.password?.length >= 8 &&
    formData.password === formData.confirmPassword &&
    formData.agreeToTerms;

  const handleSubmit = async (e) => {
    e.preventDefault();
    ['firstName','lastName','email','password','confirmPassword','agreeToTerms']
      .forEach(field => validateField(field, formData[field]));
    if (isFormValid) {
      setIsValidating(true);
      try { await onSubmit(e); } finally { setIsValidating(false); }
    }
  };

  // --- Password strength bar ---
  const strength = getPasswordStrength(formData.password || '');
  const colors = ['bg-red-500','bg-red-400','bg-yellow-400','bg-blue-400','bg-green-400','bg-green-500'];
  const labels = ['Muy débil','Débil','Regular','Buena','Fuerte','Muy fuerte'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">

      {/* Nombre y Apellido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[['firstName','Nombre'],['lastName','Apellido']].map(([key,label]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name={key}
                type="text"
                value={formData[key] || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={`Tu ${label.toLowerCase()}`}
                className={`block w-full pl-11 pr-3 py-2 border rounded-lg shadow-sm 
                  ${touched[key] && errors[key] ? 'border-red-500' : 'border-gray-300'}
                  focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            {touched[key] && errors[key] && (
              <p className="mt-1 text-sm text-red-600 animate-slide-in">{errors[key]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="tucorreo@ejemplo.com"
            className={`block w-full pl-11 pr-3 py-2 border rounded-lg shadow-sm 
              ${touched.email && errors.email ? 'border-red-500' : 'border-gray-300'}
              focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
        {touched.email && errors.email && (
          <p className="mt-1 text-sm text-red-600 animate-slide-in">{errors.email}</p>
        )}
      </div>

      {/* Contraseña */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="••••••••"
            className={`block w-full pl-11 pr-10 py-2 border rounded-lg shadow-sm 
              ${touched.password && errors.password ? 'border-red-500' : 'border-gray-300'}
              focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {formData.password && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Seguridad: {labels[strength]}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className={`h-2 rounded-full ${colors[strength]}`} style={{ width: `${(strength / 5) * 100}%` }}></div>
            </div>
          </div>
        )}

        {touched.password && errors.password
          ? <p className="mt-1 text-sm text-red-600 animate-slide-in">{errors.password}</p>
          : <PasswordRequirements password={formData.password || ''} />}
      </div>

      {/* Confirmar Contraseña */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="••••••••"
            className={`block w-full pl-11 pr-10 py-2 border rounded-lg shadow-sm 
              ${touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}
              focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {touched.confirmPassword && errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600 animate-slide-in">{errors.confirmPassword}</p>
        )}

        {touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword && (
          <p className="mt-1 text-sm text-green-600 flex items-center">
            <CheckCircle className="w-4 h-4 mr-1" /> Las contraseñas coinciden
          </p>
        )}
      </div>

      {/* Términos */}
      <div className="flex items-start">
        <input
          id="agreeToTerms"
          name="agreeToTerms"
          type="checkbox"
          checked={formData.agreeToTerms || false}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`h-4 w-4 mt-1 rounded ${touched.agreeToTerms && errors.agreeToTerms ? 'border-red-500' : 'border-gray-300'} text-blue-600 focus:ring-blue-500`}
        />
        <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-700">
          Acepto los <a href="/terminos" className="text-blue-600 hover:text-blue-500">Términos y Condiciones</a>
        </label>
      </div>
      {touched.agreeToTerms && errors.agreeToTerms && (
        <p className="text-sm text-red-600 animate-slide-in">{errors.agreeToTerms}</p>
      )}

      {/* Botón */}
      <button
        type="submit"
        disabled={!isFormValid || loading || isValidating}
        className={`group relative w-full flex justify-center items-center py-3 px-4 rounded-md text-sm font-semibold text-white transition-colors duration-200 ${
          !isFormValid || loading || isValidating
            ? 'bg-blue-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        }`}
      >
        {loading || isValidating ? (
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{isValidating ? 'Validando...' : 'Creando cuenta...'}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span>Registrarse</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        Al registrarte, aceptas nuestros Términos de Servicio y Política de Privacidad.
      </p>
    </form>
  );
}
