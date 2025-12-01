import React from 'react';
import { Home, BookOpen, Users, Calendar } from 'lucide-react';

/**
 * Componente de sección por defecto
 * Se muestra cuando no hay una sección específica seleccionada
 */
const DefaultSection = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
          <Home className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Bienvenido
        </h1>
        <p className="text-lg text-gray-600">
          Selecciona una sección del menú para comenzar
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Sesiones de Estudio</h3>
              <p className="text-sm text-gray-600">Gestiona tus sesiones</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Grupos</h3>
              <p className="text-sm text-gray-600">Únete a grupos de estudio</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Calendario</h3>
              <p className="text-sm text-gray-600">Ve tus eventos y sesiones</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Home className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Dashboard</h3>
              <p className="text-sm text-gray-600">Resumen de tu actividad</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefaultSection;
