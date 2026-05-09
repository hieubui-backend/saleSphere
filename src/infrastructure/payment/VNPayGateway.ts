import { VNPay, ignoreLogger, HashAlgorithm, ProductCode, VnpLocale } from 'vnpay';

export default class VNPayGateway {
    private vnpay: VNPay;

    constructor() {
        this.vnpay = new VNPay({
            tmnCode: process.env.VNPAY_TMN_CODE || 'DEMO',
            secureSecret: process.env.VNPAY_SECURE_SECRET || 'SECRET',
            vnpayHost: 'https://sandbox.vnpayment.vn',
            testMode: true,
            hashAlgorithm: HashAlgorithm.SHA512,
            enableLog: true,
            loggerFn: ignoreLogger,
        });
    }

    /**
     * Tạo URL thanh toán VNPay
     */
    public createPaymentUrl(orderId: string, amount: number, ipAddr: string, returnUrl: string): string {
        return this.vnpay.buildPaymentUrl({
            vnp_Amount: amount,
            vnp_IpAddr: ipAddr || '127.0.0.1',
            vnp_TxnRef: String(orderId),
            vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl: returnUrl,
            vnp_Locale: VnpLocale.VN
        });
    }

    /**
     * Xác thực kết quả từ VNPay Return URL
     */
    public verifyReturn(query: any): any {
        return this.vnpay.verifyReturnUrl(query);
    }

    /**
     * Xác thực kết quả từ VNPay IPN Call
     */
    public verifyIpn(query: any): any {
        return this.vnpay.verifyIpnCall(query);
    }
}





