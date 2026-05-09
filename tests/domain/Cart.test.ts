import { CartEntity } from '../../src/domain/entities/CartEntity';

describe('CartEntity Entity', () => {
    it('should initialize empty cart', () => {
        const cart = new CartEntity({ customerId: 'c1' });
        expect(cart.items.length).toBe(0);
        expect(cart.getTotalItems()).toBe(0);
        expect(cart.getTotalPrice()).toBe(0);
    });

    it('should add new item', () => {
        const cart = new CartEntity({ customerId: 'c1' });
        const product = { id: 'p1', name: 'ProductEntity', price: 100 };
        
        cart.addItem(product, 2);
        
        expect(cart.items.length).toBe(1);
        expect(cart.getTotalItems()).toBe(2);
        expect(cart.getTotalPrice()).toBe(200);
    });

    it('should increase quantity if item exists', () => {
        const cart = new CartEntity({ customerId: 'c1' });
        const product = { id: 'p1', name: 'ProductEntity', price: 100 };
        
        cart.addItem(product, 2);
        cart.addItem(product, 3);
        
        expect(cart.items.length).toBe(1);
        expect(cart.items[0].quantity).toBe(5);
        expect(cart.getTotalPrice()).toBe(500);
    });

    it('should update item quantity', () => {
        const cart = new CartEntity({ customerId: 'c1' });
        const product = { id: 'p1', name: 'ProductEntity', price: 100 };
        cart.addItem(product, 2);
        
        cart.updateItemQuantity('p1', 5);
        expect(cart.getTotalItems()).toBe(5);
    });

    it('should throw error when updating to invalid quantity', () => {
        const cart = new CartEntity({ customerId: 'c1' });
        const product = { id: 'p1', name: 'ProductEntity', price: 100 };
        cart.addItem(product, 2);
        
        expect(() => cart.updateItemQuantity('p1', -1)).toThrow();
        expect(() => cart.updateItemQuantity('p1', 0)).toThrow();
    });

    it('should remove item', () => {
        const cart = new CartEntity({ customerId: 'c1' });
        const product = { id: 'p1', name: 'ProductEntity', price: 100 };
        cart.addItem(product, 2);
        
        cart.removeItem('p1');
        expect(cart.items.length).toBe(0);
    });
});





