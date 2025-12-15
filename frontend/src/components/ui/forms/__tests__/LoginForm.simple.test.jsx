import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginForm from '../LoginForm';

describe('LoginForm - Tests Básicos', () => {
  const defaultFormData = {
    email: '',
    password: '',
  };

  const mockOnChange = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar el formulario de login', () => {
    render(
      <LoginForm
        formData={defaultFormData}
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        loading={false}
      />
    );

    expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });

  it('debe mostrar el botón deshabilitado cuando está cargando', () => {
    render(
      <LoginForm
        formData={defaultFormData}
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        loading={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Iniciando sesión/i });
    expect(submitButton).toBeDisabled();
  });

  it('debe mostrar campos con valores iniciales', () => {
    const formData = {
      email: 'test@example.com',
      password: 'password123',
    };

    render(
      <LoginForm
        formData={formData}
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        loading={false}
      />
    );

    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('password123')).toBeInTheDocument();
  });
});

