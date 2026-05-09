import Email from '../../src/domain/value-objects/Email';

describe('Email Value Object', () => {
    it('should create valid email', () => {
        const email = new Email('test@example.com');
        expect(email.getValue()).toBe('test@example.com');
    });

    it('should convert to lowercase and trim', () => {
        const email = new Email('  TEST@eXample.com  ');
        expect(email.getValue()).toBe('test@example.com');
    });

    it('should throw error for invalid emails', () => {
        expect(() => new Email('invalid')).toThrow();
        expect(() => new Email('test@.com')).toThrow();
        expect(() => new Email('@example.com')).toThrow();
        expect(() => new Email('')).toThrow();
    });

    it('should check equality correctly', () => {
        const email1 = new Email('test@example.com');
        const email2 = new Email('TEST@example.com');
        expect(email1.equals(email2)).toBe(true);
    });
});





