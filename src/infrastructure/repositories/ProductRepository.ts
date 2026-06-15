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

    public async findBySlug(slug: string): Promise<ProductEntity | null> {
        const doc = await this.productModel.findOne({ slug, deletedAt: null }).lean();
        return ProductMapper.toDomain(doc);
    }

    public async findAll(query: any = {}): Promise<ProductEntity[]> {
        // Mặc định loại trừ sản phẩm đã soft-delete
        const safeQuery = { deletedAt: null, ...query };
        const docs = await this.productModel.find(safeQuery).sort({ createdAt: -1 }).lean();
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

    /**
     * Trừ kho theo variantId (atomic — tránh race condition)
     */
    public async decrementStock(id: string, quantity: number, variantId?: string, session?: any): Promise<boolean> {
        if (variantId) {
            // Trừ kho variant cụ thể (Color + Size)
            const doc = await this.productModel.findOneAndUpdate(
                {
                    _id: id,
                    'variants._id': variantId,
                    'variants.stock': { $gte: quantity }
                },
                { $inc: { 'variants.$.stock': -quantity, soldCount: quantity } },
                { session, new: true }
            ).lean();
            return !!doc;
        } else {
            // Fallback: không dùng variant (backward-compatible)
            const doc = await this.productModel.findOneAndUpdate(
                { _id: id },
                { $inc: { soldCount: quantity } },
                { session, new: true }
            ).lean();
            return !!doc;
        }
    }

    /**
     * Soft delete (không xóa cứng dữ liệu sản phẩm)
     */
    public async softDeleteById(id: string): Promise<void> {
        await this.productModel.findByIdAndUpdate(id, {
            $set: { deletedAt: new Date(), isActive: false }
        });
    }

    public async deleteById(id: string): Promise<void> {
        await this.productModel.findByIdAndDelete(id);
    }

    /**
     * Tìm kiếm full-text (name, brand, tags, description)
     */
    public async search(keyword: string, filters: {
        category?: string;
        brand?: string;
        gender?: string;
        minPrice?: number;
        maxPrice?: number;
    } = {}): Promise<ProductEntity[]> {
        const query: any = { deletedAt: null, isActive: true };

        if (keyword) {
            query.$text = { $search: keyword };
        }
        if (filters.category) query.category = filters.category;
        if (filters.brand) query.brand = { $regex: filters.brand, $options: 'i' };
        if (filters.gender) query.gender = filters.gender;
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            query.price = {};
            if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
            if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
        }

        const docs = await this.productModel
            .find(query)
            .sort(keyword ? { score: { $meta: 'textScore' } } : { soldCount: -1 })
            .lean();

        return docs.map(doc => ProductMapper.toDomain(doc)!);
    }

    /**
     * Cập nhật stats denormalized sau khi có review mới
     */
    public async updateRatingStats(productId: string, averageRating: number, reviewCount: number): Promise<void> {
        await this.productModel.findByIdAndUpdate(productId, {
            $set: { averageRating, reviewCount }
        });
    }
}
