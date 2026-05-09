import ProductEntity from '../../src/domain/entities/ProductEntity';

describe('ProductEntity Entity', () => {
    it('should create a valid product entity', () => {
        const product = new ProductEntity({
            id: '1',
            name: 'Test ProductEntity',
            price: 100,
            stock: 10
        });

        expect(product.name).toBe('Test ProductEntity');
        expect(product.stock).toBe(10);
    });

    it('should deduct stock correctly', () => {
        const product = new ProductEntity({ id: '1', name: 'P1', price: 100, stock: 10 });
        product.deductStock(5);
        expect(product.stock).toBe(5);
    });

    it('should throw error when stock is insufficient', () => {
        const product = new ProductEntity({ id: '1', name: 'P1', price: 100, stock: 10 });
        expect(() => product.deductStock(11)).toThrow(/không đủ hàng/);
    });

    it('should add stock correctly', () => {
        const product = new ProductEntity({ id: '1', name: 'P1', price: 100, stock: 10 });
        product.addStock(5);
        expect(product.stock).toBe(15);
    });
});





