const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const { supabase, supabaseAdmin } = require('../../config/database');

// Mock de Supabase
jest.mock('../../config/database', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      getUser: jest.fn(),
      updateUser: jest.fn(),
    },
  },
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

// Mock de servicios
jest.mock('../../services/refreshTokenService');
jest.mock('../../services/tokenBlacklistService');

// Mock de middleware de autenticación
const mockAuth = (req, res, next) => {
  req.user = { id: 'test-user-id', email: 'test@example.com' };
  next();
};

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('debe registrar un nuevo usuario exitosamente', async () => {
      const mockUser = {
        id: 'new-user-id',
        email: 'newuser@example.com',
        user_metadata: { name: 'New User' },
      };

      supabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: 'new-user-id', email: 'newuser@example.com', name: 'New User' }],
          error: null,
        }),
      });
      
      supabaseAdmin.from.mockReturnValue({
        insert: mockInsert,
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          name: 'New User',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
    });

    it('debe rechazar registro con email inválido', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('debe rechazar registro con contraseña débil', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('debe iniciar sesión exitosamente', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
      };

      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'user-id', email: 'test@example.com', name: 'Test User' },
            error: null,
          }),
        }),
      });
      
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      
      supabaseAdmin.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('debe rechazar login con credenciales incorrectas', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});

