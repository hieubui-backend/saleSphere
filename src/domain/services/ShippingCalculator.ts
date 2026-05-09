export default class ShippingCalculator {
    // Biểu phí tham khảo
    private static readonly REGION_RATES: Record<string, number> = {
        'MIEN_BAC': 30000,
        'MIEN_TRUNG': 40000,
        'MIEN_NAM': 50000,
        'HA_NOI': 20000,
        'HO_CHI_MINH': 25000,
        'DEFAULT': 35000
    };

    /**
     * Tính phí vận chuyển dựa trên khu vực
     * @param region Mã khu vực (VD: 'HA_NOI', 'MIEN_NAM')
     * @returns Phí vận chuyển (VNĐ)
     */
    public static calculateFee(region?: string): number {
        if (!region) return this.REGION_RATES['DEFAULT'];
        
        const normalizedRegion = region.trim().toUpperCase().replace(/\s+/g, '_');
        
        return this.REGION_RATES[normalizedRegion] || this.REGION_RATES['DEFAULT'];
    }
}





