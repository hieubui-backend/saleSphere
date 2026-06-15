import ProductEntity from '../../src/domain/entities/ProductEntity';

describe('ProductEntity Entity', () => {
    it('should create a valid product entity', () => {
        const product = new ProductEntity({
            id: '1',
            name: 'Test ProductEntity',
            price: 100,
            variants: [{ color: 'Red', size: 'M', stock: 10, additionalPrice: 0 }]
        });

        expect(product.name).toBe('Test ProductEntity');
        expect(product.getTotalStock()).toBe(10);
    });

    it('should deduct stock correctly', () => {
        const product = new ProductEntity({ id: '1', name: 'P1', price: 100, variants: [{ _id: 'v1', color: 'Red', size: 'M', stock: 10, additionalPrice: 0 }] });
        product.deductStock(5, 'v1');
        expect(product.getTotalStock()).toBe(5);
    });

    it('should throw error when stock is insufficient', () => {
        const product = new ProductEntity({ id: '1', name: 'P1', price: 100, variants: [{ _id: 'v1', color: 'Red', size: 'M', stock: 10, additionalPrice: 0 }] });
        expect(() => product.deductStock(11, 'v1')).toThrow(/không đủ hàng/);
    });

    it('should add stock correctly', () => {
        const product = new ProductEntity({ id: '1', name: 'P1', price: 100, variants: [{ _id: 'v1', color: 'Red', size: 'M', stock: 10, additionalPrice: 0 }] });
        product.addStock(5, 'v1');
        expect(product.getTotalStock()).toBe(15);
    });
});





