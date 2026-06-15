/**
 * ProductEntity — Rich Domain Model
 * Hỗ trợ variant Màu + Size theo chuẩn thời trang B2C
 */

export interface ProductVariant {
    _id?: string;
    color: string;           // Tên màu: 'Đen', 'Trắng'
    colorHex?: string;       // Mã màu hex: '#000000'
    size: string;            // 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | 'One Size'
    sku?: string;            // Mã SKU nội bộ: 'AT-001-BLACK-M'
    stock: number;           // Tồn kho theo variant
    additionalPrice?: number; // Chênh lệch giá so với basePrice (mặc định: 0)
}

export interface ProductEntityProps {
    id?: string;
    name: string;
    slug?: string;           // SEO-friendly URL: 'ao-thun-cotton-basics'
    price: number;           // Giá cơ bản (basePrice)
    originalPrice?: number;  // Giá gốc (trước giảm giá, để tính %)
    discountPercent?: number; // % giảm giá: 0-100
    description?: string;
    images?: string[];
    category?: string;
    brand?: string;          // Thương hiệu
    gender?: 'male' | 'female' | 'unisex' | 'kids';
    tags?: string[];         // ['oversize', 'cotton', 'basic-tee']
    material?: string;       // '100% Cotton'
    variants?: ProductVariant[];
    isActive?: boolean;
    deletedAt?: Date | null;
    // Denormalized stats (cập nhật qua background job)
    averageRating?: number;
    reviewCount?: number;
    soldCount?: number;
}

export default class ProductEntity {
    public id?: string;
    public name: string;
    public slug?: string;
    public price: number;
    public originalPrice?: number;
    public discountPercent: number;
    public description?: string;
    public images: string[];
    public category?: string;
    public brand?: string;
    public gender?: 'male' | 'female' | 'unisex' | 'kids';
    public tags: string[];
    public material?: string;
    public variants: ProductVariant[];
    public isActive: boolean;
    public deletedAt?: Date | null;
    public averageRating: number;
    public reviewCount: number;
    public soldCount: number;

    constructor(props: ProductEntityProps) {
        this.id = props.id;
        this.name = props.name;
        this.slug = props.slug;
        this.price = props.price;
        this.originalPrice = props.originalPrice;
        this.discountPercent = props.discountPercent ?? 0;
        this.description = props.description;
        this.images = props.images ?? [];
        this.category = props.category;
        this.brand = props.brand;
        this.gender = props.gender;
        this.tags = props.tags ?? [];
        this.material = props.material;
        this.variants = props.variants ?? [];
        this.isActive = props.isActive ?? true;
        this.deletedAt = props.deletedAt ?? null;
        this.averageRating = props.averageRating ?? 0;
        this.reviewCount = props.reviewCount ?? 0;
        this.soldCount = props.soldCount ?? 0;
    }

    /**
     * Lấy tổng tồn kho trên tất cả variants
     */
    public getTotalStock(): number {
        if (this.variants.length === 0) return 0;
        return this.variants.reduce((sum, v) => sum + v.stock, 0);
    }

    /**
     * Trừ kho theo variantId cụ thể (atomic-safe ở DB layer)
     */
    public deductStock(quantity: number, variantId?: string): void {
        if (variantId) {
            const variant = this.variants.find(v => v._id === variantId);
            if (!variant) throw new Error(`Không tìm thấy variant: ${variantId}`);
            if (variant.stock < quantity) {
                throw new Error(`Variant ${variant.color}/${variant.size} không đủ hàng (Còn: ${variant.stock}, Cần: ${quantity})`);
            }
            variant.stock -= quantity;
        } else {
            const totalStock = this.getTotalStock();
            if (totalStock < quantity) {
                throw new Error(`Sản phẩm ${this.name} không đủ hàng (Còn: ${totalStock}, Cần: ${quantity})`);
            }
        }
    }

    /**
     * Hoàn kho theo variantId
     */
    public addStock(quantity: number, variantId?: string): void {
        if (variantId) {
            const variant = this.variants.find(v => v._id === variantId);
            if (!variant) throw new Error(`Không tìm thấy variant: ${variantId}`);
            variant.stock += quantity;
        }
    }

    /**
     * Lấy giá thực tế (có tính giảm giá)
     */
    public getEffectivePrice(variantId?: string): number {
        const basePrice = this.price;
        const additionalPrice = variantId
            ? (this.variants.find(v => v._id === variantId)?.additionalPrice ?? 0)
            : 0;
        const discountedPrice = basePrice * (1 - this.discountPercent / 100);
        return Math.round(discountedPrice + additionalPrice);
    }

    /**
     * Soft delete
     */
    public softDelete(): void {
        this.deletedAt = new Date();
        this.isActive = false;
    }
}
