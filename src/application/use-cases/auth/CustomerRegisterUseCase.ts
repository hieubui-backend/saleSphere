import CustomerEntity from '../../../domain/entities/CustomerEntity';
import Email from '../../../domain/value-objects/Email';
import { ICustomerRepository } from '../../../domain/repositories/ICustomerRepository';

export default class CustomerRegisterUseCase {
    private customerRepository: ICustomerRepository;
    private hasher: any; // Cần type sau khi convert Hasher

    constructor({ customerRepository, hasher }: { customerRepository: ICustomerRepository, hasher: any }) {
        this.customerRepository = customerRepository;
        this.hasher = hasher;
    }

    public async execute({ name, email, password, phone, address }: any): Promise<any> {
        const emailVO = new Email(email);
        
        // 1. Kiểm tra email tồn tại
        const existingCustomer = await this.customerRepository.findByEmail(emailVO.getValue());
        if (existingCustomer) {
            throw new Error('Email này đã được sử dụng!');
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

        if (!savedCustomer) throw new Error('Không thể tạo tài khoản');

        // Xóa password trước khi trả về
        const response: any = { ...savedCustomer };
        delete response.password;

        return response;
    }
}





