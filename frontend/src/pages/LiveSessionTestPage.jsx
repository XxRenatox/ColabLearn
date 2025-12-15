import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ActiveSessionSection from '../components/ui/dashboard/sessions/ActiveSessionSection';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { ArrowLeft } from 'lucide-react';

const LiveSessionTestPage = () => {
  const navigate = useNavigate();
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Datos mock de usuario
  const mockUser = {
    id: 'test-user-1',
    name: 'Usuario de Prueba',
    email: 'test@example.com',
    avatar: null,
    university: 'Universidad de Prueba',
    career: 'Ingeniería',
    level: 5,
    xp: 1250
  };

  // Datos mock de sesión en vivo
  const [mockSession, setMockSession] = useState({
    id: 'test-session-1',
    title: 'Sesión de Estudio - Matemáticas Aplicadas',
    description: 'Sesión de estudio colaborativo sobre álgebra lineal y cálculo diferencial',
    type: 'study',
    status: 'in_progress',
    scheduled_date: new Date().toISOString(),
    duration: 120, // 2 horas
    location_type: 'virtual',
    location_details: 'Sala virtual de ColabLearn',
    platform: 'ColabLearn',
    group_id: 'test-group-1',
    organizer_id: 'test-organizer-1',
    groups: {
      id: 'test-group-1',
      name: 'Matemáticas Aplicadas - Grupo A',
      color: '#3B82F6',
      subject: 'MAT200',
      university: 'Universidad de Prueba',
      career: 'Ingeniería',
      semester: '2025-1'
    },
    organizer: {
      id: 'test-organizer-1',
      name: 'Prof. María González',
      avatar: null,
      university: 'Universidad de Prueba',
      career: 'Matemáticas',
      level: 10,
      xp: 5000
    },
    session_attendance: [
      {
        user_id: 'test-user-1',
        status: 'attending',
        joined_at: new Date(Date.now() - 1800000).toISOString(), // Hace 30 min
        users: {
          id: 'test-user-1',
          name: 'Usuario de Prueba',
          avatar: null,
          university: 'Universidad de Prueba',
          career: 'Ingeniería'
        }
      },
      {
        user_id: 'test-user-2',
        status: 'attending',
        joined_at: new Date(Date.now() - 1200000).toISOString(), // Hace 20 min
        users: {
          id: 'test-user-2',
          name: 'Juan Pérez',
          avatar: null,
          university: 'Universidad de Prueba',
          career: 'Ingeniería'
        }
      },
      {
        user_id: 'test-user-3',
        status: 'attending',
        joined_at: new Date(Date.now() - 900000).toISOString(), // Hace 15 min
        users: {
          id: 'test-user-3',
          name: 'Ana Martínez',
          avatar: null,
          university: 'Universidad de Prueba',
          career: 'Ingeniería'
        }
      },
      {
        user_id: 'test-organizer-1',
        status: 'attending',
        joined_at: new Date(Date.now() - 3600000).toISOString(), // Hace 1 hora
        users: {
          id: 'test-organizer-1',
          name: 'Prof. María González',
          avatar: null,
          university: 'Universidad de Prueba',
          career: 'Matemáticas'
        }
      }
    ],
    attendees: [
      {
        id: 'test-user-1',
        user_id: 'test-user-1',
        name: 'Usuario de Prueba',
        avatar: null,
        role: 'member'
      },
      {
        id: 'test-user-2',
        user_id: 'test-user-2',
        name: 'Juan Pérez',
        avatar: null,
        role: 'member'
      },
      {
        id: 'test-user-3',
        user_id: 'test-user-3',
        name: 'Ana Martínez',
        avatar: null,
        role: 'member'
      }
    ],
    participants: 4,
    attendee_count: 4,
    resources: [
      {
        id: 'resource-1',
        name: 'Guía de Álgebra Lineal',
        type: 'document',
        url: '#',
        resource_type: 'document'
      },
      {
        id: 'resource-2',
        name: 'Ejercicios Resueltos',
        type: 'document',
        url: '#',
        resource_type: 'document'
      },
      {
        id: 'resource-3',
        name: 'Video Tutorial',
        type: 'link',
        url: '#',
        resource_type: 'link'
      }
    ],
    sessionData: {
      id: 'test-session-1',
      title: 'Sesión de Estudio - Matemáticas Aplicadas',
      type: 'study',
      duration: 120,
      platform: 'ColabLearn',
      location_type: 'virtual',
      location_details: 'Sala virtual de ColabLearn',
      organizer: {
        id: 'test-organizer-1',
        name: 'Prof. María González',
        avatar: null,
        university: 'Universidad de Prueba',
        career: 'Matemáticas'
      },
      groups: {
        id: 'test-group-1',
        name: 'Matemáticas Aplicadas - Grupo A',
        color: '#3B82F6',
        subject: 'MAT200'
      }
    },
    startTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    endTime: new Date(Date.now() + 120 * 60000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    timeElapsed: 0
  });

  // Simular tiempo transcurrido
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
      setMockSession(prev => ({
        ...prev,
        timeElapsed: prev.timeElapsed + 1
      }));
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, []);

  // Actualizar tiempo transcurrido inicial
  useEffect(() => {
    const startTime = new Date(mockSession.scheduled_date);
    const now = new Date();
    const elapsedMinutes = Math.floor((now - startTime) / 60000);
    setTimeElapsed(elapsedMinutes);
    setMockSession(prev => ({
      ...prev,
      timeElapsed: elapsedMinutes
    }));
  }, []);

  const handleLeaveSession = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Botón para volver */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al Dashboard</span>
        </button>

        {/* Información de prueba */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            🧪 Página de Prueba - Sesión en Vivo
          </h3>
          <p className="text-sm text-yellow-800 mb-2">
            Esta es una página de prueba con datos simulados. La sesión muestra funcionalidad completa incluyendo:
          </p>
          <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
            <li>Chat en tiempo real (modo local)</li>
            <li>Lista de participantes</li>
            <li>Recursos compartidos</li>
            <li>Notas de sesión</li>
            <li>Control de sesión para organizador</li>
            <li>Timer de sesión en vivo</li>
          </ul>
          <div className="mt-3 text-xs text-yellow-700">
            <strong>Tiempo transcurrido:</strong> {Math.floor(timeElapsed / 60)}:{String(timeElapsed % 60).padStart(2, '0')} / {Math.floor(mockSession.duration / 60)}:00
          </div>
        </div>

        {/* Componente de sesión activa */}
        <ActiveSessionSection
          session={mockSession}
          user={mockUser}
          onLeaveSession={handleLeaveSession}
        />
      </main>
      <Footer />
    </div>
  );
};

export default LiveSessionTestPage;

