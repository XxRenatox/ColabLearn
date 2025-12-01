import React from "react";
import { Plus, X, GraduationCap } from "lucide-react";

const universities = [
  "Universidad de Chile",
  "Pontificia Universidad Católica de Chile",
  "Universidad Diego Portales",
  "Universidad de Santiago",
  "Universidad Católica del Norte",
  "Universidad de Concepción",
  "Universidad Austral de Chile",
  "Universidad Técnica Federico Santa María",
];

const careers = [
  "Ingeniería Civil",
  "Medicina",
  "Derecho",
  "Psicología",
  "Ingeniería Comercial",
  "Arquitectura",
  "Enfermería",
  "Odontología",
  "Periodismo",
  "Diseño Gráfico",
  "Ingeniería Industrial",
  "Kinesiología",
  "Veterinaria",
  "Educación",
  "Trabajo Social",
  "Ingeniería Informática",
];

const AcademicInfoStep = ({ setPreferences, preferences, handleAcademicInfoChange }) => {
  const [currentSubject, setCurrentSubject] = React.useState("");

  const addSubject = () => {
    if (currentSubject.trim()) {
      handleAcademicInfoChange('subjects', [...(preferences.subjects || []), currentSubject.trim()]);
      setCurrentSubject("");
    }
  };

  const removeSubject = (subject) => {
    const updatedSubjects = (preferences.subjects || []).filter((s) => s !== subject);
    handleAcademicInfoChange('subjects', updatedSubjects);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Información Académica
        </h2>
        <p className="text-gray-600">
          Cuéntanos sobre tu carrera y materias para encontrar compañeros
          compatibles
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Universidad *
          </label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={preferences.university}
            onChange={(e) => handleAcademicInfoChange('university', e.target.value)}
          >
            <option value="">Selecciona tu universidad</option>
            {universities.map((uni) => (
              <option key={uni} value={uni}>
                {uni}
              </option>
            ))}
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Carrera *
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={preferences.career}
              onChange={(e) => handleAcademicInfoChange('career', e.target.value)}
            >
              <option value="">Selecciona tu carrera</option>
              {careers.map((career) => (
                <option key={career} value={career}>
                  {career}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Semestre/Año *
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={preferences.semester}
              onChange={(e) => handleAcademicInfoChange('semester', e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="1">1er Semestre</option>
              <option value="2">2do Semestre</option>
              <option value="3">3er Semestre</option>
              <option value="4">4to Semestre</option>
              <option value="5">5to Semestre</option>
              <option value="6">6to Semestre</option>
              <option value="7">7mo Semestre</option>
              <option value="8">8vo Semestre</option>
              <option value="9">9no Semestre</option>
              <option value="10">10mo Semestre</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Materias que estudias
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={currentSubject}
              onChange={(e) => setCurrentSubject(e.target.value)}
              placeholder="Ej: Cálculo I, Anatomía, Historia..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && addSubject()}
            />
            <button
              onClick={addSubject}
              className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferences.subjects && preferences.subjects.map((subject, index) => (
              <div
                key={`${subject}-${index}`}
                className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center gap-2"
              >
                {subject}
                <button onClick={() => removeSubject(subject)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicInfoStep;