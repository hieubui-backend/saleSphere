/**
 * ProductEntity Entity - Rich Domain Model
 */
export interface ProductEntityProps {
    id?: string;
    name: string;
    price: number;
    stock: number;
    description?: string;
    images?: string[];
    category?: string;
    isActive?: boolean;
}

export default class ProductEntity {
    public id?: string;
    public name: string;
    public price: number;
    public stock: number;
    public description?: string;
    public images?: string[];
    public category?: string;
    public isActive?: boolean;

    constructor({ id, name, price, stock, description, images, category, isActive }: ProductEntityProps) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.stock = stock;
        this.description = description;
        this.images = images;
        this.category = category;
        this.isActive = isActive ?? true;
    }

    /**
     * Trừ kho sản phẩm
     * @param quantity 
     * @throws Error nếu không đủ hàng
     */
    public deductStock(quantity: number): void {
        if (this.stock < quantity) {
            throw new Error(`Sản phẩm ${this.name} không đủ hàng trong kho (Còn: ${this.stock}, Cần: ${quantity})`);
        }
        this.stock -= quantity;
    }

    /**
     * Hoàn kho sản phẩm
     * @param quantity 
     */
    public addStock(quantity: number): void {
        this.stock += quantity;
    }
}





