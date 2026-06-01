import { PayOS } from '@payos/node';
import config from '../../config/config';

export default class PayOSGateway {
    private payos: PayOS;

    constructor() {
        this.payos = new PayOS({
            clientId: config.payOSClientId,
            apiKey: config.payOSApiKey,
            checksumKey: config.payOSChecksumKey
        });
    }

    /**
     * Tạo Link thanh toán PayOS (VietQR)
     */
    public async createPaymentLink(orderId: string, amount: number, description: string, returnUrl: string, cancelUrl: string): Promise<any> {
        // PayOS yêu cầu orderCode là số nguyên
        // Chúng ta sẽ lấy 6 số cuối của timestamp để tạo orderCode giả định hoặc băm từ orderId
        const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));
        
        const body = {
            orderCode,
            amount,
            description: description.substring(0, 25), // PayOS giới hạn 25 ký tự description
            returnUrl,
            cancelUrl
        };

        return await this.payos.paymentRequests.create(body);
    }

    /**
     * Xác thực Webhook từ PayOS
     */
    public verifyWebhookData(body: any): any {
        return this.payos.webhooks.verify(body);
    }

    /**
     * Lấy thông tin thanh toán từ PayOS
     */
    public async getPaymentLinkInformation(orderCode: number | string): Promise<any> {
        return await this.payos.paymentRequests.get(Number(orderCode));
    }
}
