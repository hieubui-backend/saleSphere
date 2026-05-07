const AdminLoginUseCase = require('../../../src/application/use-cases/auth/AdminLoginUseCase');

describe('AdminLoginUseCase', () => {
    let adminLoginUseCase;
    let mockUserRepository;
    let mockTenantModel;
    let mockHasher;

    beforeEach(() => {
        // Khởi tạo các Mock objects
        mockUserRepository = {
            findByEmail: jest.fn()
        };

        mockTenantModel = {
            findById: jest.fn().mockReturnThis(),
            lean: jest.fn()
        };

        mockHasher = {
            compare: jest.fn()
        };

        // Inject các Mock vào Use Case
        adminLoginUseCase = new AdminLoginUseCase({
            userRepository: mockUserRepository,
            tenantModel: mockTenantModel,
            hasher: mockHasher
        });
    });

    it('nên văng lỗi nếu email không tồn tại', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);

        await expect(adminLoginUseCase.execute({ email: 'wrong@mail.com', password: '123' }))
            .rejects.toThrow('Email hoặc mật khẩu không chính xác!');
            
        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('wrong@mail.com');
    });

    it('nên văng lỗi nếu mật khẩu sai', async () => {
        mockUserRepository.findByEmail.mockResolvedValue({ email: 'test@mail.com', password: 'hashedpassword' });
        mockHasher.compare.mockResolvedValue(false); // Mật khẩu sai

        await expect(adminLoginUseCase.execute({ email: 'test@mail.com', password: 'wrongpassword' }))
            .rejects.toThrow('Email hoặc mật khẩu không chính xác!');
    });

    it('nên trả về thông tin Super Admin nếu đúng role super_admin', async () => {
        const mockUser = {
            _id: 'user123',
            name: 'Super Boss',
            role: 'super_admin',
            password: 'hashedpassword'
        };
        
        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockHasher.compare.mockResolvedValue(true);

        const result = await adminLoginUseCase.execute({ email: 'super@mail.com', password: 'correct' });

        expect(result).toEqual({
            id: 'user123',
            name: 'Super Boss',
            tenantId: null,
            tenantName: 'Hệ thống Quản trị',
            role: 'super_admin'
        });
    });

    it('nên văng lỗi nếu admin không có tenantId', async () => {
        const mockUser = {
            _id: 'user123',
            name: 'Admin',
            role: 'admin',
            tenantId: null, // Thiếu tenantId
            password: 'hashedpassword'
        };
        
        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockHasher.compare.mockResolvedValue(true);

        await expect(adminLoginUseCase.execute({ email: 'admin@mail.com', password: '123' }))
            .rejects.toThrow('Tài khoản không thuộc cửa hàng nào!');
    });

    it('nên văng lỗi nếu cửa hàng bị khóa (isActive: false)', async () => {
        const mockUser = {
            _id: 'user123',
            name: 'Admin',
            role: 'admin',
            tenantId: 'tenant123',
            password: 'hashedpassword'
        };
        
        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockHasher.compare.mockResolvedValue(true);
        mockTenantModel.lean.mockResolvedValue({ _id: 'tenant123', isActive: false }); // Cửa hàng bị khóa

        await expect(adminLoginUseCase.execute({ email: 'admin@mail.com', password: '123' }))
            .rejects.toThrow('Cửa hàng của bạn đã bị khóa hoặc ngừng hoạt động!');
    });

    it('nên trả về thông tin Admin nếu đăng nhập thành công', async () => {
        const mockUser = {
            _id: 'user123',
            name: 'Admin',
            role: 'admin',
            tenantId: 'tenant123',
            password: 'hashedpassword'
        };
        
        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockHasher.compare.mockResolvedValue(true);
        mockTenantModel.lean.mockResolvedValue({ _id: 'tenant123', name: 'My Shop', isActive: true });

        const result = await adminLoginUseCase.execute({ email: 'admin@mail.com', password: '123' });

        expect(result).toEqual({
            id: 'user123',
            name: 'Admin',
            tenantId: 'tenant123',
            tenantName: 'My Shop',
            role: 'admin'
        });
    });
});
