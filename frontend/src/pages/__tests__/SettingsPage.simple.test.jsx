import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock simple de los módulos antes de importar usando alias
jest.mock('@/contexts/AppContext', () => ({
  useApp: () => ({
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      university: 'Test University',
      career: 'Test Career',
      semester: '5',
    },
    updateUser: jest.fn(),
  }),
}));

jest.mock('@/services/api', () => ({
  usersAPI: {
    updateProfile: jest.fn().mockResolvedValue({ success: true }),
    changePassword: jest.fn().mockResolvedValue({ success: true }),
  },
}));

jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Importar después de los mocks
import SettingsPage from '../SettingsPage';

describe('SettingsPage - Tests Básicos', () => {
  it('debe renderizar la página de configuración', () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  it('debe mostrar las pestañas de navegación', () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Perfil')).toBeInTheDocument();
    expect(screen.getByText('Contraseña')).toBeInTheDocument();
  });
});

