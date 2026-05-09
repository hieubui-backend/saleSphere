export interface CartItemProps {
    productId: string;
    quantity: number;
    price: number;
    name: string;
}

export class CartItem {
    public productId: string;
    public quantity: number;
    public price: number;
    public name: string;

    constructor({ productId, quantity, price, name }: CartItemProps) {
        if (quantity <= 0) throw new Error('Số lượng phải lớn hơn 0');
        this.productId = productId;
        this.name = name;
        this.price = price;
        this.quantity = quantity;
    }

    public updateQuantity(quantity: number): void {
        if (quantity <= 0) throw new Error('Số lượng phải lớn hơn 0');
        this.quantity = quantity;
    }

    public getSubtotal(): number {
        return this.price * this.quantity;
    }
}

export interface CartEntityProps {
    id?: string;
    customerId: string;
    items?: CartItemProps[];
}

export class CartEntity {
    public id?: string;
    public customerId: string;
    public items: CartItem[];

    constructor({ id, customerId, items = [] }: CartEntityProps) {
        this.id = id;
        this.customerId = customerId;
        this.items = items.map(item => new CartItem(item));
    }

    public addItem(productEntity: { id: string; name: string; price: number }, quantity: number): void {
        const existingItem = this.items.find(item => String(item.productId) === String(productEntity.id));
        
        if (existingItem) {
            existingItem.updateQuantity(existingItem.quantity + quantity);
        } else {
            this.items.push(new CartItem({
                productId: productEntity.id,
                name: productEntity.name,
                price: productEntity.price,
                quantity: quantity
            }));
        }
    }

    public removeItem(productId: string): void {
        this.items = this.items.filter(item => String(item.productId) !== String(productId));
    }

    public updateItemQuantity(productId: string, quantity: number): void {
        const item = this.items.find(i => String(i.productId) === String(productId));
        if (!item) throw new Error('Sản phẩm không có trong giỏ hàng');
        
        item.updateQuantity(quantity);
    }

    public getTotalItems(): number {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    public getTotalPrice(): number {
        return this.items.reduce((sum, item) => sum + item.getSubtotal(), 0);
    }

    public clear(): void {
        this.items = [];
    }
}





