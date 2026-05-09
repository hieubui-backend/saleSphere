import request from 'supertest';
import express from 'express';
import session from 'express-session';
import * as awilix from 'awilix';

// Mock DI Container
jest.mock('../../src/di/container', () => {
    const awilix = require('awilix');
    const container = awilix.createContainer();
    
    container.register({
        adminLoginUseCase: awilix.asValue({
            execute: jest.fn()
        }),
        adminRegisterUseCase: awilix.asValue({
            execute: jest.fn()
        }),
        tokenManager: awilix.asValue({
            generateToken: jest.fn().mockReturnValue('mocked-token')
        })
    });
    return container;
});

import container from '../../src/di/container';
import authRoute from '../../src/presentation/routes/auth.route';

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));

// Inject container
app.use((req: any, res, next) => {
    req.container = container;
    next();
});

app.use('/api/auth', authRoute);

describe('Auth Integration Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('POST /api/auth/login nên trả về token nếu đăng nhập thành công', async () => {
        const cradle = container.cradle as any;
        const { adminLoginUseCase } = cradle;
        (adminLoginUseCase.execute as jest.Mock).mockResolvedValue({
            id: '123',
            name: 'Admin',
            role: 'admin',
            email: 'admin@mail.com'
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@mail.com', password: 'password123' });

        expect(adminLoginUseCase.execute).toHaveBeenCalledWith({ email: 'admin@mail.com', password: 'password123' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBe('mocked-token');
        expect(res.body.data.user.email).toBe('admin@mail.com');
    });

    it('POST /api/auth/register nên gọi usecase và trả về user khi thành công', async () => {
        const cradle = container.cradle as any;
        const { adminRegisterUseCase } = cradle;
        (adminRegisterUseCase.execute as jest.Mock).mockResolvedValue({
            id: '123',
            name: 'Admin',
            role: 'admin',
            email: 'a@mail.com'
        }); // Thành công

        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Admin', email: 'a@mail.com', password: 'password123' });

        expect(adminRegisterUseCase.execute).toHaveBeenCalled();
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe('a@mail.com');
    });
});
