import { Model } from 'mongoose';
import CustomerEntity from '../../domain/entities/CustomerEntity';
import CustomerMapper from '../mappers/CustomerMapper';
import { ICustomer } from '../database/models/customer.model';

import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository';

export default class CustomerRepository implements ICustomerRepository {
    private customerModel: Model<ICustomer>;

    constructor({ customerModel }: { customerModel: Model<ICustomer> }) {
        this.customerModel = customerModel;
    }

    public async findByEmail(email: string): Promise<CustomerEntity | null> {
        const doc = await this.customerModel.findOne({ email }).lean();
        return CustomerMapper.toDomain(doc);
    }

    public async findById(id: string): Promise<CustomerEntity | null> {
        const doc = await this.customerModel.findById(id).lean();
        return CustomerMapper.toDomain(doc);
    }

    public async findOne(query: any): Promise<CustomerEntity | null> {
        const doc = await this.customerModel.findOne(query).lean();
        return CustomerMapper.toDomain(doc);
    }

    public async create(customerEntity: CustomerEntity): Promise<CustomerEntity | null> {
        const persistenceData = CustomerMapper.toPersistence(customerEntity);
        const doc = await this.customerModel.create(persistenceData);
        return CustomerMapper.toDomain(doc);
    }

    public async updateById(id: string, customerEntity: CustomerEntity): Promise<CustomerEntity | null> {
        const persistenceData = CustomerMapper.toPersistence(customerEntity);
        const doc = await this.customerModel.findByIdAndUpdate(id, persistenceData, { new: true }).lean();
        return CustomerMapper.toDomain(doc);
    }

    public async deleteById(id: string): Promise<void> {
        await this.customerModel.findByIdAndDelete(id);
    }

    public async countDocuments(filter: any = {}): Promise<number> {
        return await this.customerModel.countDocuments(filter);
    }

    public async findAll(filter: any = {}, sort: any = { createdAt: -1 }): Promise<CustomerEntity[]> {
        const docs = await this.customerModel.find(filter).sort(sort).lean();
        return docs.map(doc => CustomerMapper.toDomain(doc)!);
    }
}





