const { VNPay, ignoreLogger } = require('vnpay');

class VNPayGateway {
    constructor() {
        this.vnpay = new VNPay({
            tmnCode: process.env.VNPAY_TMN_CODE || 'DEMO',
            secureSecret: process.env.VNPAY_SECURE_SECRET || 'SECRET',
            vnpayHost: 'https://sandbox.vnpayment.vn',
            testMode: true,
            hashAlgorithm: 'SHA512',
            enableLog: true,
            loggerFn: ignoreLogger,
        });
    }

    /**
     * Tạo URL thanh toán VNPay
     */
    createPaymentUrl(orderId, amount, ipAddr, returnUrl) {
        return this.vnpay.buildPaymentUrl({
            vnp_Amount: amount,
            vnp_IpAddr: ipAddr || '127.0.0.1',
            vnp_TxnRef: String(orderId),
            vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
            vnp_OrderType: 'other',
            vnp_ReturnUrl: returnUrl,
            vnp_Locale: 'vn'
        });
    }

    /**
     * Xác thực kết quả từ VNPay Return URL
     */
    verifyReturn(query) {
        return this.vnpay.verifyReturnUrl(query);
    }

    /**
     * Xác thực kết quả từ VNPay IPN Call
     */
    verifyIpn(query) {
        return this.vnpay.verifyIpnCall(query);
    }
}

module.exports = VNPayGateway;
