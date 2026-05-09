import Email from '../../../domain/value-objects/Email';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import AppError from '../../../infrastructure/errors/AppError';

export default class AdminLoginUseCase {
    private userRepository: IUserRepository;
    private hasher: any;

    constructor({ userRepository, hasher }: { userRepository: IUserRepository, hasher: any }) {
        this.userRepository = userRepository;
        this.hasher = hasher;
    }

    public async execute({ email, password }: any): Promise<any> {
        const emailVO = new Email(email);

        const user = await this.userRepository.findByEmail(emailVO.getValue());
        if (!user) {
            throw new AppError('Email hoặc mật khẩu không chính xác!', 401);
        }

        const isMatch = await this.hasher.compare(password, user.password);
        if (!isMatch) {
            throw new AppError('Email hoặc mật khẩu không chính xác!', 401);
        }

        return {
            id: user.id, 
            name: user.name, 
            email: user.email,
            role: user.role 
        };
    }
}





