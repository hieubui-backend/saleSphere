import CustomerEntity from '../../../domain/entities/CustomerEntity';
import Email from '../../../domain/value-objects/Email';
import { ICustomerRepository } from '../../../domain/repositories/ICustomerRepository';
import AppError from '../../../infrastructure/errors/AppError';

export default class CustomerUseCases {
    private customerRepository: ICustomerRepository;
    private cartUseCases: any; // Cần type sau khi convert CartUseCases

    constructor({ customerRepository, cartUseCases }: { customerRepository: ICustomerRepository, cartUseCases: any }) {
        this.customerRepository = customerRepository;
        this.cartUseCases = cartUseCases;
    }

    public async createCustomer({ name, email, phone }: { name: string, email: string, phone?: string }): Promise<CustomerEntity | null> {
        const emailVO = new Email(email);
        const existing = await this.customerRepository.findByEmail(emailVO.getValue());
        if (existing) throw new AppError('Email đã tồn tại!', 400);

        const customerEntity = new CustomerEntity({ name, email: emailVO.getValue(), phone, addresses: [] });
        return await this.customerRepository.create(customerEntity);
    }

    public async updateCustomer(id: string, { name, email, phone }: { name?: string, email?: string, phone?: string }): Promise<CustomerEntity | null> {
        const customerEntity = await this.customerRepository.findById(id);
        if (!customerEntity) throw new AppError('Không tìm thấy người mua!', 404);

        customerEntity.updateProfile({ name, phone });

        if (email) {
            customerEntity.email = new Email(email).getValue();
        }

        return await this.customerRepository.updateById(id, customerEntity);
    }

    public async deleteCustomer(id: string): Promise<CustomerEntity> {
        const customerEntity = await this.customerRepository.findById(id);
        if (!customerEntity) throw new AppError('Không tìm thấy người mua!', 404);
        await this.customerRepository.deleteById(id);
        return customerEntity;
    }

    public async getAllCustomers(filter: any = {}): Promise<CustomerEntity[]> {
        return await this.customerRepository.findAll(filter);
    }

    public async addToCart(customerId: string, { productId, quantity = 1 }: { productId: string, quantity?: number }): Promise<any> {
        return await this.cartUseCases.addToCart(customerId, { productId, quantity });
    }
}
