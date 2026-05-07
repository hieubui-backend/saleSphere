const request = require('supertest');
const express = require('express');
const session = require('express-session');
const path = require('path');

// Mock DI Container trước khi import routes
jest.mock('../../src/di/container', () => {
    const awilix = require('awilix');
    const container = awilix.createContainer();
    
    container.register({
        adminLoginUseCase: awilix.asValue({
            execute: jest.fn()
        }),
        adminRegisterUseCase: awilix.asValue({
            execute: jest.fn()
        })
    });
    return container;
});

const container = require('../../src/di/container');
const adminRoute = require('../../src/modules/admin/admin.route');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));

// Setup view engine giả lập vì auth.controller gọi res.render
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../src/views'));

// Inject container
app.use((req, res, next) => {
    req.container = container;
    next();
});

app.use('/admin', adminRoute);

describe('Auth Integration Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('POST /admin/login nên trả về redirect nếu đăng nhập thành công', async () => {
        const { adminLoginUseCase } = container.cradle;
        adminLoginUseCase.execute.mockResolvedValue({
            id: '123',
            name: 'Admin',
            role: 'admin',
            tenantId: 't1'
        });

        const res = await request(app)
            .post('/admin/login')
            .send({ email: 'admin@mail.com', password: '123' });

        expect(adminLoginUseCase.execute).toHaveBeenCalledWith({ email: 'admin@mail.com', password: '123' });
        // Redirect tới dashboard
        expect(res.status).toBe(302);
        expect(res.header.location).toBe('/admin/dashboard');
    });

    it('POST /admin/register nên gọi usecase và redirect khi thành công', async () => {
        const { adminRegisterUseCase } = container.cradle;
        adminRegisterUseCase.execute.mockResolvedValue({}); // Thành công

        const res = await request(app)
            .post('/admin/register')
            .send({ shopName: 'Shop', name: 'A', email: 'a@mail.com', password: '123' });

        expect(adminRegisterUseCase.execute).toHaveBeenCalled();
        expect(res.status).toBe(302);
        expect(res.header.location).toBe('/admin/login?message=registered_pending');
    });
});

