import UserEntity from '../../../domain/entities/UserEntity';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';

export default class UserUseCases {
    private userRepository: IUserRepository;
    private hasher: any;
    private tokenManager: any;

    constructor({ userRepository, hasher, tokenManager }: { userRepository: IUserRepository, hasher: any, tokenManager: any }) {
        this.userRepository = userRepository;
        this.hasher = hasher;
        this.tokenManager = tokenManager;
    }

    public async register(userData: any): Promise<any> {
        const { email, password, name, role } = userData;
        
        const userExists = await this.userRepository.findByEmail(email);
        if (userExists) throw new Error('Email đã được sử dụng');

        const hashedPassword = await this.hasher.hash(password);

        const user = await this.userRepository.create(new UserEntity({
            name,
            email,
            password: hashedPassword,
            role: role || 'staff'
        }));

        if (!user) throw new Error('Không thể đăng ký người dùng');

        return {
            id: user.id,
            name: user.name,
            email: user.email
        };
    }

    public async login(email: string, password: string): Promise<any> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) throw new Error('Email hoặc mật khẩu không đúng');

        const isMatch = await this.hasher.compare(password, user.password);
        if (!isMatch) throw new Error('Email hoặc mật khẩu không đúng');

        const token = this.tokenManager.generateToken({
            id: user.id, 
            role: user.role
        });

        return {
            token,
            user: { 
                id: user.id, 
                name: user.name, 
                role: user.role
            }
        };
    }

    public async getUserById(id: string): Promise<UserEntity | null> {
        return await this.userRepository.findById(id);
    }

    public async getAllUsers({ page = 1, limit = 10 }: { page?: number, limit?: number }): Promise<any> {
        const skip = (page - 1) * limit;
        const limitNum = Number(limit);
        
        const users = await this.userRepository.findByRole('staff', skip, limitNum);
        const count = await this.userRepository.countByRole('staff');

        return { users, count };
    }

    public async updateUser(id: string, updateData: any): Promise<UserEntity | null> {
        const user = await this.userRepository.findById(id);
        if (!user) throw new Error('Người dùng không tồn tại');
        
        if (updateData.name) user.name = updateData.name;
        if (updateData.role) user.role = updateData.role;

        return await this.userRepository.updateById(id, user);
    }

    public async deleteUser(id: string): Promise<void> {
        return await this.userRepository.deleteById(id);
    }
}





