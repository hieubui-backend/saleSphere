import CustomerEntity from '../../../domain/entities/CustomerEntity';
import Email from '../../../domain/value-objects/Email';
import { ICustomerRepository } from '../../../domain/repositories/ICustomerRepository';
import EmailService from '../../../infrastructure/services/EmailService';
import EmailQueue from '../../../infrastructure/queue/EmailQueue';

import AppError from '../../../infrastructure/errors/AppError';

export default class CustomerRegisterUseCase {
    private customerRepository: ICustomerRepository;
    private emailService: EmailService;
    private emailQueue: EmailQueue;
    private hasher: any;


    constructor({ customerRepository, emailService, emailQueue, hasher }: { customerRepository: ICustomerRepository, emailService: EmailService, emailQueue: EmailQueue, hasher: any }) {
        this.customerRepository = customerRepository;
        this.emailService = emailService;
        this.emailQueue = emailQueue;
        this.hasher = hasher;
    }


    public async execute({ name, email, password, phone, address }: any): Promise<any> {
        const emailVO = new Email(email);
        
        // 1. Kiểm tra email tồn tại
        const existingCustomer = await this.customerRepository.findByEmail(emailVO.getValue());
        if (existingCustomer) {
            throw new AppError('Email này đã được sử dụng!', 400);
        }

        // 2. Hash password
        const hashedPassword = await this.hasher.hash(password);

        // 3. Tạo CustomerEntity Entity
        const newCustomerEntity = new CustomerEntity({
            name,
            email: emailVO.getValue(),
            password: hashedPassword,
            phone,
            address
        });

        // 4. Lưu vào Database
        const savedCustomer = await this.customerRepository.create(newCustomerEntity);

        if (!savedCustomer) throw new AppError('Không thể tạo tài khoản', 400);

        // 5. Gửi email chào mừng (Background via Queue)
        this.emailQueue.addWelcomeEmailJob(savedCustomer.email, savedCustomer.name);


        // Xóa password trước khi trả về
        const response: any = { ...savedCustomer };
        delete response.password;

        return response;
    }
}
