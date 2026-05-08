/**
 * Product Entity - Rich Domain Model
 */
class Product {
    constructor({ id, name, price, stock }) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.stock = stock;
    }

    /**
     * Trừ kho sản phẩm
     * @param {number} quantity 
     * @throws Error nếu không đủ hàng
     */
    deductStock(quantity) {
        if (this.stock < quantity) {
            throw new Error(`Sản phẩm ${this.name} không đủ hàng trong kho (Còn: ${this.stock}, Cần: ${quantity})`);
        }
        this.stock -= quantity;
    }

    /**
     * Hoàn kho sản phẩm
     * @param {number} quantity 
     */
    addStock(quantity) {
        this.stock += quantity;
    }
}

module.exports = Product;
