const Customer = require('../../../domain/entities/Customer');
const Email = require('../../../domain/value-objects/Email');

class CustomerUseCases {
    constructor({ customerRepository, cartUseCases }) {
        this.customerRepository = customerRepository;
        this.cartUseCases = cartUseCases;
    }

    async createCustomer({ name, email, phone, address }) {
        const emailVO = new Email(email);
        const existing = await this.customerRepository.findByEmail(emailVO.getValue());
        if (existing) throw new Error('Email đã tồn tại!');
        
        const customerEntity = new Customer({ name, email: emailVO.getValue(), phone, address });
        return await this.customerRepository.create(customerEntity);
    }

    async updateCustomer(id, { name, email, phone, address }) {
        const customerEntity = await this.customerRepository.findById(id);
        if (!customerEntity) throw new Error('Không tìm thấy người mua!');
        
        // Gọi hành vi Domain
        customerEntity.updateProfile({ name, phone, address });
        
        if (email) {
            customerEntity.email = new Email(email).getValue();
        }

        return await this.customerRepository.updateById(id, customerEntity);
    }

    async deleteCustomer(id) {
        const customerEntity = await this.customerRepository.findById(id);
        if (!customerEntity) throw new Error('Không tìm thấy người mua!');
        await this.customerRepository.deleteById(id);
        return customerEntity;
    }

    async getAllCustomers(filter = {}) {
        return await this.customerRepository.findAll(filter);
    }

    async addToCart(customerId, { productId, price, quantity = 1 }) {
        return await this.cartUseCases.addToCart(customerId, { productId, quantity });
    }
}

module.exports = CustomerUseCases;
