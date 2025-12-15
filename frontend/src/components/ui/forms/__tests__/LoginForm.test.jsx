import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../LoginForm';

const mockOnSubmit = jest.fn();
const mockOnChange = jest.fn();

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultFormData = {
    email: '',
    password: '',
  };

  const renderLoginForm = (props = {}) => {
    // Asegurar que formData siempre esté definido
    const formData = props.formData !== undefined ? props.formData : defaultFormData;
    const onChange = props.onChange || mockOnChange;
    
    // Separar props para evitar sobrescribir formData
    const { formData: _, onChange: __, ...restProps } = props;
    
    return render(
      <LoginForm
        onSubmit={mockOnSubmit}
        formData={formData}
        onChange={onChange}
        loading={props.loading || false}
        {...restProps}
      />
    );
  };

  describe('Renderizado', () => {
    it('debe renderizar el formulario de login', () => {
      renderLoginForm();
      expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
    });

    it('debe mostrar el botón de login deshabilitado cuando está cargando', () => {
      renderLoginForm({ loading: true });
      const submitButton = screen.getByRole('button', { name: /Iniciando sesión/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Validación', () => {
    it('debe validar que el email sea requerido cuando se envía el formulario', async () => {
      renderLoginForm();
      const emailInput = screen.getByPlaceholderText('Correo electrónico');
      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
      
      // Hacer blur en el campo para marcarlo como touched y disparar validación
      fireEvent.blur(emailInput);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/El correo electrónico es requerido/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('debe validar formato de email', async () => {
      const formData = { email: 'invalid-email', password: '' };
      const onChange = jest.fn();
      renderLoginForm({ formData, onChange });
      const emailInput = screen.getByPlaceholderText('Correo electrónico');
      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

      // Hacer blur para marcar como touched y disparar validación
      fireEvent.blur(emailInput);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Formato de correo inválido/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('debe validar que la contraseña sea requerida cuando se envía el formulario', async () => {
      const formData = { email: 'test@example.com', password: '' };
      const onChange = jest.fn();
      renderLoginForm({ formData, onChange });
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

      // Hacer blur para marcar como touched
      fireEvent.blur(passwordInput);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/La contraseña es requerida/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Interacción', () => {
    it('debe llamar onSubmit con los datos correctos', async () => {
      let formData = { email: 'test@example.com', password: 'password123' };
      const onChange = jest.fn((e) => {
        formData = { ...formData, [e.target.name]: e.target.value };
      });
      
      renderLoginForm({ formData, onChange });
      const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('debe mostrar/ocultar la contraseña', () => {
      renderLoginForm();
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const toggleButton = passwordInput.parentElement.querySelector('button[aria-label*="contraseña"]');

      expect(passwordInput.type).toBe('password');

      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe('text');

      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });
  });
});

