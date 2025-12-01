import React, { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Check, AlertCircle, CheckCircle, X } from "lucide-react";
import StudyPreferenceStep from "../components/ui/preferences/StudyPreferenceStep";
import PersonalityStep from "../components/ui/preferences/PersonalityStep";
import DisponibilyStep from "../components/ui/preferences/AvailabilityStep";
import AcademicInfoStep from "../components/ui/preferences/AcademicInfoStep";
import StudyEnvironmentStep from "../components/ui/preferences/StudyEnvironmentStep";
import { useLocation, useNavigate } from "react-router-dom";
import { usersAPI } from "../services/api";
import { getAuthToken } from "../services/tokenManager";

const MatchingPreferences = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, supabaseSession } = location.state || {};
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Función para mostrar notificaciones
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Función para cerrar notificación manualmente
  const closeNotification = () => {
    setNotification(null);
  };

  // Verificar autenticación al cargar
  useEffect(() => {
    if (!token || !user) {
      showNotification('No se encontraron datos de sesión. Redirigiendo al login...', 'error');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [token, user, navigate]);

  // Separar información académica de las preferencias de matching
  const [academicInfo, setAcademicInfo] = useState({
    university: user?.university || "",
    career: user?.career || "",
    semester: user?.semester || "",
    subjects: [], // Agregar array de materias
  });

  const [preferences, setPreferences] = useState({
    bio: "",
    subjects: [],
    studyTimes: [],
    sessionDuration: "",
    studyFrequency: "",
    groupSize: "",
    studyLocation: [],
    noiseLevel: "",
    studyStyle: [],
    personality: [],
    communicationStyle: "",
    goals: [],
    weekDays: [],
    timeSlots: [],
    timezone: "America/Santiago",
  });

  const totalSteps = 5;

  // Validaciones por paso (solo para el paso actual)
  const validateStep = (step) => {
    const errors = {};

    switch (step) {
      case 1:
        // Información académica (OBLIGATORIA para este paso)
        if (!academicInfo.university || academicInfo.university.trim().length < 2) {
          errors.university = 'Universidad es requerida (mínimo 2 caracteres)';
        }
        if (!academicInfo.career || academicInfo.career.trim().length < 2) {
          errors.career = 'Carrera es requerida (mínimo 2 caracteres)';
        }
        if (!academicInfo.semester || academicInfo.semester.trim().length < 1) {
          errors.semester = 'Semestre es requerido';
        }
        break;
      case 2:
        // Preferencias de estudio (al menos un campo)
        const hasStudyPrefs = preferences.subjects?.length > 0 || 
                             preferences.sessionDuration || 
                             preferences.studyFrequency ||
                             preferences.groupSize;
        if (!hasStudyPrefs) {
          errors.general = 'Completa al menos un campo de preferencias de estudio';
        }
        break;
      case 3:
        // Ambiente de estudio (al menos un campo)
        const hasEnvironmentPrefs = preferences.studyLocation?.length > 0 || 
                                   preferences.noiseLevel ||
                                   preferences.studyStyle?.length > 0;
        if (!hasEnvironmentPrefs) {
          errors.general = 'Completa al menos un campo de ambiente de estudio';
        }
        break;
      case 4:
        // Disponibilidad (al menos un campo)
        const hasAvailability = preferences.weekDays?.length > 0 || 
                               preferences.timeSlots?.length > 0;
        if (!hasAvailability) {
          errors.general = 'Selecciona al menos algunos días u horarios disponibles';
        }
        break;
      case 5:
        // Personalidad (al menos un campo)
        const hasPersonality = preferences.personality?.length > 0 || 
                              preferences.communicationStyle ||
                              preferences.goals?.length > 0;
        if (!hasPersonality) {
          errors.general = 'Completa al menos un campo de personalidad';
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    // Validar antes de continuar (OBLIGATORIO)
    const isValid = validateStep(currentStep);
    
    if (!isValid) {
      showNotification('Por favor completa todos los campos requeridos antes de continuar', 'error');
      return;
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setValidationErrors({});
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setValidationErrors({});
    }
  };

  const handleMultiSelect = (field, value) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  // Función para actualizar información académica
  const handleAcademicInfoChange = (field, value) => {
    setAcademicInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const submitPreferences = async () => {
    // Validar que al menos tengamos la información académica básica
    if (!academicInfo.university || !academicInfo.career || !academicInfo.semester) {
      showNotification('Por favor completa al menos la información académica antes de guardar', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Combinar información académica con las preferencias
      const requestBody = {
        university: academicInfo.university,
        career: academicInfo.career,
        semester: academicInfo.semester,
        preferences: {
          ...preferences,
          subjects: academicInfo.subjects || []
        }
      };

      const authToken = token || getAuthToken();
      if (!authToken) {
        showNotification('No se encontró un token válido. Inicia sesión nuevamente.', 'error');
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error(`Error del servidor (${response.status}): No se pudo procesar la respuesta`);
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `Error ${response.status}: ${response.statusText}`);
      }

      showNotification('¡Preferencias guardadas exitosamente!', 'success');

      // Redirigir al dashboard después de un breve delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      // Manejo de errores
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        showNotification('Error de conexión. Verifica que el servidor esté ejecutándose.', 'error');
      } else if (error.message.includes('401')) {
        showNotification('Sesión expirada. Por favor inicia sesión nuevamente.', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification(`Error al guardar: ${error.message}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Componente de notificación
  const NotificationComponent = () => {
    if (!notification) return null;

    const bgColor = notification.type === 'success' ? 'bg-green-50 border-green-200' :
      notification.type === 'error' ? 'bg-red-50 border-red-200' :
        'bg-blue-50 border-blue-200';

    const textColor = notification.type === 'success' ? 'text-green-800' :
      notification.type === 'error' ? 'text-red-800' :
        'text-blue-800';

    const Icon = notification.type === 'success' ? CheckCircle : AlertCircle;

    return (
      <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${bgColor} ${textColor} shadow-lg max-w-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Icon className="w-5 h-5 mr-2" />
            <span className="font-medium">{notification.message}</span>
          </div>
          <button onClick={closeNotification} className="ml-4 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-gray-600">
          Paso {currentStep} de {totalSteps}
        </span>
        <span className="text-sm font-medium text-purple-600">
          {Math.round((currentStep / totalSteps) * 100)}% completado
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>

      {/* Indicadores de pasos */}
      <div className="flex justify-between mt-4">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step <= currentStep
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}>
              {step < currentStep ? <Check className="w-4 h-4" /> : step}
            </div>
            <span className="text-xs mt-1 text-gray-500">
              {step === 1 ? 'Académico' :
                step === 2 ? 'Estudio' :
                  step === 3 ? 'Ambiente' :
                    step === 4 ? 'Horarios' : 'Personalidad'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <AcademicInfoStep
      setPreferences={setPreferences}
      preferences={academicInfo}
      handleAcademicInfoChange={handleAcademicInfoChange}
      validationErrors={validationErrors}
    />
  );

  const renderStep2 = () => (
    <StudyPreferenceStep
      setPreferences={setPreferences}
      preferences={preferences}
      validationErrors={validationErrors}
    />
  );

  const renderStep3 = () => (
    <StudyEnvironmentStep
      setPreferences={setPreferences}
      handleMultiSelect={handleMultiSelect}
      preferences={preferences}
      validationErrors={validationErrors}
    />
  );

  const renderStep4 = () => (
    <DisponibilyStep
      setPreferences={setPreferences}
      handleMultiSelect={handleMultiSelect}
      preferences={preferences}
      validationErrors={validationErrors}
    />
  );

  const renderStep5 = () => (
    <PersonalityStep
      setPreferences={setPreferences}
      handleMultiSelect={handleMultiSelect}
      preferences={preferences}
      validationErrors={validationErrors}
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <NotificationComponent />

      <div className="max-w-4xl mx-auto p-6 pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Configura tus Preferencias
          </h1>
          <p className="text-gray-600">
            Ayúdanos a encontrar los mejores compañeros de estudio para ti
          </p>
        </div>

        {renderProgressBar()}

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          {/* Mensaje informativo */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Completa al menos un campo en cada paso. Cuanta más información proporciones, mejores serán las recomendaciones de grupos de estudio.
            </p>
          </div>

          <div className="min-h-[400px]">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                currentStep === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Atrás
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={submitPreferences}
                disabled={isLoading}
                className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                } text-white`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    Guardar Preferencias
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingPreferences;