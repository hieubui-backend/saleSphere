import CustomerEntity from '../entities/CustomerEntity';

export interface ICustomerRepository {
    findByEmail(email: string): Promise<CustomerEntity | null>;
    findById(id: string): Promise<CustomerEntity | null>;
    findOne(query: any): Promise<CustomerEntity | null>;
    create(customerEntity: CustomerEntity): Promise<CustomerEntity | null>;
    updateById(id: string, customerEntity: CustomerEntity): Promise<CustomerEntity | null>;
    deleteById(id: string): Promise<void>;
    countDocuments(filter?: any): Promise<number>;
    findAll(filter?: any, sort?: any): Promise<CustomerEntity[]>;
}
