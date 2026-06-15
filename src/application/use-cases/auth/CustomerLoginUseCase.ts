import Email from '../../../domain/value-objects/Email';
import { ICustomerRepository } from '../../../domain/repositories/ICustomerRepository';
import BcryptHasher from '../../../infrastructure/security/BcryptHasher';
import TokenManager from '../../../infrastructure/security/TokenManager';
import AppError from '../../../infrastructure/errors/AppError';

export default class CustomerLoginUseCase {
    private customerRepository: ICustomerRepository;
    private hasher: BcryptHasher;
    private tokenManager: TokenManager;

    constructor({ customerRepository, hasher, tokenManager }: { 
        customerRepository: ICustomerRepository, 
        hasher: BcryptHasher, 
        tokenManager: TokenManager 
    }) {
        this.customerRepository = customerRepository;
        this.hasher = hasher;
        this.tokenManager = tokenManager;
    }

    public async execute({ email, password }: any): Promise<any> {
        const emailVO = new Email(email);

        const customer = await this.customerRepository.findByEmail(emailVO.getValue());
        if (!customer) {
            throw new AppError('Email hoặc mật khẩu không chính xác!', 401);
        }

        const isMatch = await this.hasher.compare(password, customer.password);
        if (!isMatch) {
            throw new AppError('Email hoặc mật khẩu không chính xác!', 401);
        }

        const customerId = (customer as any).id || (customer as any)._id;
        if (!customerId) {
            throw new AppError('Lỗi hệ thống: Không trích xuất được ID của khách hàng!', 500);
        }

        const tokenPayload = {
            id: customerId,
            role: 'customer'
        };
        const token = this.tokenManager.generateToken(tokenPayload);

        return {
            token,
            customer: {
                id: customerId,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                addresses: customer.addresses,
                avatar: customer.avatar
            }
        };
    }
}
