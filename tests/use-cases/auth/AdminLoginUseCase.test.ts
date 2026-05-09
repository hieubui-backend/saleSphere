import AdminLoginUseCase from '../../../src/application/use-cases/auth/AdminLoginUseCase';

describe('AdminLoginUseCase', () => {
    let adminLoginUseCase: AdminLoginUseCase;
    let mockUserRepository: any;
    let mockHasher: any;

    beforeEach(() => {
        mockUserRepository = {
            findByEmail: jest.fn()
        };

        mockHasher = {
            compare: jest.fn()
        };

        adminLoginUseCase = new AdminLoginUseCase({
            userRepository: mockUserRepository,
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
        mockHasher.compare.mockResolvedValue(false);

        await expect(adminLoginUseCase.execute({ email: 'test@mail.com', password: 'wrongpassword' }))
            .rejects.toThrow('Email hoặc mật khẩu không chính xác!');
    });

    it('nên trả về thông tin Admin nếu đăng nhập thành công', async () => {
        const mockUser = {
            id: 'user123',
            name: 'Admin Boss',
            email: 'admin@mail.com',
            role: 'admin',
            password: 'hashedpassword'
        };
        
        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockHasher.compare.mockResolvedValue(true);

        const result = await adminLoginUseCase.execute({ email: 'admin@mail.com', password: 'correct' });

        expect(result).toEqual({
            id: 'user123',
            name: 'Admin Boss',
            email: 'admin@mail.com',
            role: 'admin'
        });
    });
});





