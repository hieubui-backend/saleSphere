const Product = require('../../src/domain/entities/Product');

describe('Product Entity', () => {
    it('should create a valid product entity', () => {
        const product = new Product({
            id: '1',
            name: 'Test Product',
            price: 100,
            stock: 10
        });

        expect(product.name).toBe('Test Product');
        expect(product.stock).toBe(10);
    });

    it('should deduct stock correctly', () => {
        const product = new Product({ id: '1', name: 'P1', price: 100, stock: 10 });
        product.deductStock(5);
        expect(product.stock).toBe(5);
    });

    it('should throw error when stock is insufficient', () => {
        const product = new Product({ id: '1', name: 'P1', price: 100, stock: 10 });
        expect(() => product.deductStock(11)).toThrow(/không đủ hàng/);
    });

    it('should add stock correctly', () => {
        const product = new Product({ id: '1', name: 'P1', price: 100, stock: 10 });
        product.addStock(5);
        expect(product.stock).toBe(15);
    });
});
