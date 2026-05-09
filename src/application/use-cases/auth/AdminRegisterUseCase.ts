import UserEntity from '../../../domain/entities/UserEntity';
import Email from '../../../domain/value-objects/Email';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';

export default class AdminRegisterUseCase {
    private userRepository: IUserRepository;
    private hasher: any;

    constructor({ userRepository, hasher }: { userRepository: IUserRepository, hasher: any }) {
        this.userRepository = userRepository;
        this.hasher = hasher;
    }

    public async execute({ name, email, password }: any): Promise<any> {
        const emailVO = new Email(email);

        const userExists = await this.userRepository.findByEmail(emailVO.getValue());
        if (userExists) {
            throw new Error('Email này đã được sử dụng!');
        }

        const hashedPassword = await this.hasher.hash(password);

        const userEntity = new UserEntity({
            name,
            email: emailVO.getValue(),
            password: hashedPassword,
            role: 'admin'
        });

        const newUser = await this.userRepository.create(userEntity);

        if (!newUser) throw new Error('Không thể đăng ký admin');

        const response: any = { ...newUser };
        delete response.password;
        
        return response;
    }
}





