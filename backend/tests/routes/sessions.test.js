const request = require('supertest');
const express = require('express');
const sessionsRouter = require('../../routes/sessions');
const { errorHandler, AppError } = require('../../middleware/errorHandler');

// Mocks
jest.mock('../../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 'test-user-id' };
        next();
    }
}));

jest.mock('../../config/database', () => ({
    supabase: {
        from: jest.fn(),
        rpc: jest.fn()
    },
    supabaseAdmin: {
        from: jest.fn(),
        rpc: jest.fn()
    }
}));

const { supabase, supabaseAdmin } = require('../../config/database');

// Setup Express App
const app = express();
app.use(express.json());
app.use((req, res, next) => {
    req.app.set('io', { to: () => ({ emit: jest.fn() }) }); // Mock Socket.IO
    next();
});

const { authenticateToken } = require('../../middleware/auth');
app.use('/api/sessions', authenticateToken, sessionsRouter);
app.use(errorHandler);

describe('Sessions Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/sessions', () => {


        it('should fail if scheduled date is less than 4 hours from now', async () => {
            // Mock Group Member check (admin/moderator)
            supabaseAdmin.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({
                                    data: { role: 'admin' },
                                    error: null
                                })
                            })
                        })
                    })
                })
            });

            const now = new Date();
            const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);

            const res = await request(app)
                .post('/api/sessions')
                .send({
                    title: 'Test Session',
                    group_id: '123e4567-e89b-12d3-a456-426614174000',
                    scheduled_date: threeHoursLater.toISOString(),
                    duration: 60
                });



            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/al menos 4 horas de anticipación/);
        });

        it('should create session if scheduled date is more than 4 hours from now', async () => {
            // Mock Group Member check
            const mockSelect = jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: { role: 'admin' },
                                error: null
                            })
                        })
                    })
                })
            });

            // Mock Insert Session
            const mockInsertSession = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: { id: 'new-session-id', title: 'Future Session' },
                        error: null
                    })
                })
            });

            // Mock Insert Attendance
            const mockInsertAttendance = jest.fn().mockResolvedValue({
                data: null,
                error: null
            });

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'group_members') return { select: mockSelect };
                if (table === 'sessions') return { insert: mockInsertSession };
                if (table === 'session_attendance') return { insert: mockInsertAttendance };
                return { select: jest.fn() };
            });

            const now = new Date();
            const fiveHoursLater = new Date(now.getTime() + 5 * 60 * 60 * 1000);

            const res = await request(app)
                .post('/api/sessions')
                .send({
                    title: 'Future Session',
                    group_id: '123e4567-e89b-12d3-a456-426614174000',
                    scheduled_date: fiveHoursLater.toISOString(),
                    duration: 60
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.session.id).toBe('new-session-id');
        });
    });

    describe('POST /api/sessions/test', () => {
        it('should create immediate test session ignoring 4-hour rule', async () => {
            // Mock Group Member check
            const mockSelect = jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: { role: 'admin' },
                                error: null
                            })
                        })
                    })
                })
            });

            // Mock Insert Session (In Progress)
            const mockInsertSession = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: {
                            id: 'test-session-id',
                            title: '🧪 Sesión de Prueba - Test en Vivo',
                            status: 'in_progress'
                        },
                        error: null
                    })
                })
            });

            // Mock Insert Attendance
            const mockInsertAttendance = jest.fn().mockResolvedValue({
                data: null,
                error: null
            });

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'group_members') return { select: mockSelect };
                if (table === 'sessions') return { insert: mockInsertSession };
                if (table === 'session_attendance') return { insert: mockInsertAttendance };
                return { select: jest.fn() };
            });

            const res = await request(app)
                .post('/api/sessions/test')
                .send({
                    group_id: '123e4567-e89b-12d3-a456-426614174000'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.session.status).toBe('in_progress');
            expect(res.body.message).toContain('Sesión de prueba creada');
        });
    });
});
