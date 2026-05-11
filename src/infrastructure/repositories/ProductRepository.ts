import { Model } from 'mongoose';
import ProductEntity from '../../domain/entities/ProductEntity';
import ProductMapper from '../mappers/ProductMapper';
import { IProduct } from '../database/models/product.model';

import { IProductRepository } from '../../domain/repositories/IProductRepository';

export default class ProductRepository implements IProductRepository {
    private productModel: Model<IProduct>;

    constructor({ productModel }: { productModel: Model<IProduct> }) {
        this.productModel = productModel;
    }

    public async findById(id: string): Promise<ProductEntity | null> {
        const doc = await this.productModel.findById(id).lean();
        return ProductMapper.toDomain(doc);
    }

    public async findAll(query: any = {}): Promise<ProductEntity[]> {
        const docs = await this.productModel.find(query).sort({ createdAt: -1 }).lean();
        return docs.map(doc => ProductMapper.toDomain(doc)!);
    }

    public async create(productEntity: ProductEntity): Promise<ProductEntity | null> {
        const persistenceData = ProductMapper.toPersistence(productEntity);
        const doc = await this.productModel.create(persistenceData);
        return ProductMapper.toDomain(doc);
    }

    public async updateById(id: string, productEntity: ProductEntity): Promise<ProductEntity | null> {
        const persistenceData = ProductMapper.toPersistence(productEntity);
        const doc = await this.productModel.findByIdAndUpdate(
            id,
            { $set: persistenceData },
            { new: true }
        ).lean();
        return ProductMapper.toDomain(doc);
    }
    
    public async decrementStock(id: string, quantity: number, session?: any): Promise<boolean> {
        const doc = await this.productModel.findOneAndUpdate(
            { _id: id, stock: { $gte: quantity } },
            { $inc: { stock: -quantity } },
            { session, new: true }
        ).lean();
        
        return !!doc;
    }

    public async deleteById(id: string): Promise<void> {
        await this.productModel.findByIdAndDelete(id);
    }

    public async search(keyword: string): Promise<ProductEntity[]> {
        const docs = await this.productModel.find({
            name: { $regex: keyword, $options: 'i' }
        }).lean();
        return docs.map(doc => ProductMapper.toDomain(doc)!);
    }
}





