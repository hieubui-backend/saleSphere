class CartItem {
    constructor({ productId, quantity, price, name }) {
        if (quantity <= 0) throw new Error('Số lượng phải lớn hơn 0');
        this.productId = productId;
        this.name = name;
        this.price = price;
        this.quantity = quantity;
    }

    updateQuantity(quantity) {
        if (quantity <= 0) throw new Error('Số lượng phải lớn hơn 0');
        this.quantity = quantity;
    }

    getSubtotal() {
        return this.price * this.quantity;
    }
}

class Cart {
    constructor({ id, customerId, items = [] }) {
        this.id = id;
        this.customerId = customerId;
        this.items = items.map(item => new CartItem(item));
    }

    addItem(productEntity, quantity) {
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

    removeItem(productId) {
        this.items = this.items.filter(item => String(item.productId) !== String(productId));
    }

    updateItemQuantity(productId, quantity) {
        const item = this.items.find(i => String(i.productId) === String(productId));
        if (!item) throw new Error('Sản phẩm không có trong giỏ hàng');
        
        item.updateQuantity(quantity);
    }

    getTotalItems() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    getTotalPrice() {
        return this.items.reduce((sum, item) => sum + item.getSubtotal(), 0);
    }

    clear() {
        this.items = [];
    }
}

module.exports = { Cart, CartItem };
