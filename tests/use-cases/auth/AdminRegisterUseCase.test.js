const AdminRegisterUseCase = require('../../../src/application/use-cases/auth/AdminRegisterUseCase');

describe('AdminRegisterUseCase', () => {
    let adminRegisterUseCase;
    let mockUserRepository;
    let mockTenantModel;
    let mockHasher;

    beforeEach(() => {
        // Khởi tạo các Mock objects
        mockUserRepository = {
            findByEmail: jest.fn(),
            create: jest.fn()
        };

        mockTenantModel = {
            create: jest.fn()
        };

        mockHasher = {
            hash: jest.fn()
        };

        // Inject các Mock vào Use Case
        adminRegisterUseCase = new AdminRegisterUseCase({
            userRepository: mockUserRepository,
            tenantModel: mockTenantModel,
            hasher: mockHasher
        });
    });

    it('nên văng lỗi nếu email đã tồn tại', async () => {
        mockUserRepository.findByEmail.mockResolvedValue({ email: 'exist@mail.com' });

        await expect(adminRegisterUseCase.execute({ 
            shopName: 'My Shop', 
            name: 'Admin', 
            email: 'exist@mail.com', 
            password: '123' 
        })).rejects.toThrow('Email này đã được sử dụng!');
        
        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('exist@mail.com');
        expect(mockTenantModel.create).not.toHaveBeenCalled();
    });

    it('nên tạo cửa hàng và tài khoản thành công', async () => {
        // 1. Mock email chưa tồn tại
        mockUserRepository.findByEmail.mockResolvedValue(null);
        
        // 2. Mock tạo Tenant trả về ID
        mockTenantModel.create.mockResolvedValue({ _id: 'tenant123' });
        
        // 3. Mock Hash
        mockHasher.hash.mockResolvedValue('hashed_123');
        
        // 4. Mock tạo User trả về User data
        mockUserRepository.create.mockResolvedValue({
            _id: 'user123',
            name: 'Admin',
            email: 'new@mail.com',
            tenantId: 'tenant123',
            role: 'admin'
        });

        const result = await adminRegisterUseCase.execute({ 
            shopName: 'My Shop', 
            name: 'Admin', 
            email: 'new@mail.com', 
            password: '123' 
        });

        // Kiểm tra các mock function được gọi đúng logic
        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('new@mail.com');
        
        // Kiểm tra tạo tenant với slug đúng
        expect(mockTenantModel.create).toHaveBeenCalledWith({
            name: 'My Shop',
            slug: 'my-shop', // Hàm generate slug
            isActive: false,
            status: 'pending'
        });

        expect(mockHasher.hash).toHaveBeenCalledWith('123');

        expect(mockUserRepository.create).toHaveBeenCalledWith({
            name: 'Admin',
            email: 'new@mail.com',
            password: 'hashed_123',
            tenantId: 'tenant123',
            role: 'admin'
        });

        // Kết quả trả về phải là user
        expect(result).toEqual({
            _id: 'user123',
            name: 'Admin',
            email: 'new@mail.com',
            tenantId: 'tenant123',
            role: 'admin'
        });
    });
});
