import ShippingCalculator from '../../src/domain/services/ShippingCalculator';

describe('ShippingCalculator', () => {
    it('should calculate correct fee for valid regions', () => {
        expect(ShippingCalculator.calculateFee('MIEN_NAM')).toBe(50000);
        expect(ShippingCalculator.calculateFee('HA_NOI')).toBe(20000);
        expect(ShippingCalculator.calculateFee('MIEN_BAC')).toBe(30000);
    });

    it('should handle lowercase and spaces in region names', () => {
        expect(ShippingCalculator.calculateFee('mien nam')).toBe(50000);
        expect(ShippingCalculator.calculateFee(' ha noi ')).toBe(20000);
    });

    it('should return DEFAULT fee for unknown regions', () => {
        expect(ShippingCalculator.calculateFee('UNKNOWN_REGION')).toBe(35000);
    });

    it('should return DEFAULT fee when region is null or undefined', () => {
        expect(ShippingCalculator.calculateFee(null as any)).toBe(35000);
        expect(ShippingCalculator.calculateFee(undefined as any)).toBe(35000);
        expect(ShippingCalculator.calculateFee('')).toBe(35000);
    });
});





