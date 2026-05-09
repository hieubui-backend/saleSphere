import AdminRegisterUseCase from '../../../src/application/use-cases/auth/AdminRegisterUseCase';

describe('AdminRegisterUseCase', () => {
    let adminRegisterUseCase: AdminRegisterUseCase;
    let mockUserRepository: any;
    let mockHasher: any;

    beforeEach(() => {
        mockUserRepository = {
            findByEmail: jest.fn(),
            create: jest.fn()
        };

        mockHasher = {
            hash: jest.fn()
        };

        adminRegisterUseCase = new AdminRegisterUseCase({
            userRepository: mockUserRepository,
            hasher: mockHasher
        });
    });

    it('nên văng lỗi nếu email đã tồn tại', async () => {
        mockUserRepository.findByEmail.mockResolvedValue({ email: 'exist@mail.com' });

        await expect(adminRegisterUseCase.execute({ 
            name: 'Admin', 
            email: 'exist@mail.com', 
            password: '123' 
        })).rejects.toThrow('Email này đã được sử dụng!');
        
        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('exist@mail.com');
    });

    it('nên tạo tài khoản admin thành công', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockHasher.hash.mockResolvedValue('hashed_123');
        
        mockUserRepository.create.mockResolvedValue({
            id: 'user123',
            name: 'Admin',
            email: 'new@mail.com',
            role: 'admin'
        });

        const result = await adminRegisterUseCase.execute({ 
            name: 'Admin', 
            email: 'new@mail.com', 
            password: '123' 
        });

        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('new@mail.com');
        expect(mockHasher.hash).toHaveBeenCalledWith('123');
        expect(result).toEqual({
            id: 'user123',
            name: 'Admin',
            email: 'new@mail.com',
            role: 'admin'
        });
    });
});





