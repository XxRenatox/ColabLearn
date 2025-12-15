const request = require('supertest');
const express = require('express');
const userRoutes = require('../../routes/users');
const { supabase, supabaseAdmin } = require('../../config/database');
const { errorHandler } = require('../../middleware/errorHandler');

// Mock de Supabase
jest.mock('../../config/database', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      updateUser: jest.fn(),
    },
  },
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

// Mock de middleware de autenticación
const mockAuth = (req, res, next) => {
  req.user = { id: 'test-user-id', email: 'test@example.com' };
  next();
};

const app = express();
app.use(express.json());
app.use(mockAuth);
app.use('/api/users', userRoutes);
app.use(errorHandler);

describe('Users Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/profile', () => {
    it('debe obtener el perfil del usuario', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        university: 'Test University',
        career: 'Test Career',
        semester: '5',
        level: 1,
        xp: 100
      };

      const mockGroups = [{ id: 1, name: 'Group 1' }];
      const mockAchievements = [{ id: 1, name: 'Ach 1' }];

      // Helper para crear un "builder" de Supabase que se puede esperar (await)
      const createBuilder = (data) => {
        const builder = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data, error: null }),
          // Para cuando se espera el builder directamente (como en groups)
          then: (resolve) => resolve({ data, error: null })
        };
        return builder;
      };

      supabase.from.mockImplementation((table) => {
        if (table === 'users') return createBuilder(mockUser);
        if (table === 'group_members') return createBuilder(mockGroups);
        if (table === 'user_achievements') return createBuilder(mockAchievements);
        return createBuilder([]);
      });

      const response = await request(app).get('/api/users/profile');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        ...mockUser,
        groups: mockGroups,
        achievements: mockAchievements
      });
    });
  });

  describe('PUT /api/users/profile', () => {
    it('debe actualizar el perfil del usuario', async () => {
      const updatedData = {
        name: 'Updated Name',
        university: 'Updated University',
      };

      // Mock para lectura inicial (supabaseAdmin)
      const currentUser = { id: 'test-user-id', preferences: {} };
      const updatedUser = { id: 'test-user-id', ...updatedData };

      const createBuilder = (data) => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data, error: null }),
      });

      supabaseAdmin.from.mockImplementation((table) => {
        // Primero lee usuario, luego actualiza
        if (table === 'users') {
          // Hack simple: si llamamos a update returns updatedUser, si no currentUser
          // Pero update devuelve un builder que TIENE select y luego single.
          // Mejor retornamos un builder "inteligente" o simplemente mockeamos la cadena específica en el test.

          // Simplificaremos: el mock devuelve un objeto que sirve para ambas llamadas
          // La primera llamada es select().eq().single()
          // La segunda es update().eq().select().single()
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            single: jest.fn().mockImplementation(() => {
              // No podemos distinguir fácilmente cuál llamada es cuál solo con single
              // Pero podemos devolver el usuario actualizado siempre, asumiendo que el código
              // usa el resultado de la segunda llamada para la respuesta.
              // Y para la primera llamada (current) devolver algo válido también.
              return Promise.resolve({ data: updatedUser, error: null });
            })
          };
        }
        return createBuilder([]);
      });

      // Necesitamos asegurar que la primera lectura devuelva algo
      // Podemos usar mockReturnValueOnce en el test específico si fuera necesario, 
      // pero el mock genérico de arriba debería funcionar si updatedUser tiene las props necesarias.

      const response = await request(app)
        .put('/api/users/profile')
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe('Updated Name');
    });
  });

  describe('PUT /api/users/password', () => {
    it('debe cambiar la contraseña del usuario', async () => {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('OldPassword123!', 10);

      // Mock para lectura de hash (supabase)
      const createBuilder = (data) => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(), // para update 'users'
        single: jest.fn().mockResolvedValue({ data, error: null }),
        then: (resolve) => resolve({ data, error: null }) // para llamadas sin single
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'users') return createBuilder({ password_hash: hashedPassword });
        return createBuilder([]);
      });

      supabase.auth.updateUser.mockResolvedValue({ error: null });

      const response = await request(app)
        .put('/api/users/password')
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('debe rechazar cambio con contraseña actual incorrecta', async () => {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 10);

      const createBuilder = (data) => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data, error: null }),
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'users') return createBuilder({ password_hash: hashedPassword });
        return createBuilder([]);
      });

      const response = await request(app)
        .put('/api/users/password')
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
