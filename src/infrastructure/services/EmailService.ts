import nodemailer from 'nodemailer';
import config from '../../config/config';
import logger from '../logging/logger';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export default class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.mailHost,
            port: config.mailPort,
            secure: config.mailPort === 465, // true for 465, false for other ports
            auth: {
                user: config.mailUser,
                pass: config.mailPass,
            },
        });
    }

    /**
     * Gửi email chung
     */
    public async sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: config.mailFrom,
                to,
                subject,
                html,
            });
            logger.info(`✅ Email sent to ${to}`);
        } catch (error) {
            logger.error('❌ Email sending error:', error);
        }
    }

    /**
     * Gửi email xác nhận đơn hàng thành công
     */
    public async sendOrderConfirmation(to: string, orderData: any): Promise<void> {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
                <h2 style="color: #4CAF50; text-align: center;">Thanh toán thành công!</h2>
                <p>Chào bạn, đơn hàng <strong>#${orderData.orderCode}</strong> của bạn đã được thanh toán thành công.</p>
                <hr>
                <h3>Chi tiết đơn hàng:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 8px; text-align: left;">Sản phẩm</th>
                            <th style="padding: 8px; text-align: center;">SL</th>
                            <th style="padding: 8px; text-align: right;">Giá</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orderData.items.map((item: any) => `
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
                                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toLocaleString()}đ</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <p style="text-align: right; font-size: 18px;"><strong>Tổng cộng: ${orderData.totalAmount.toLocaleString()}đ</strong></p>
                <hr>
                <p style="font-size: 12px; color: #777; text-align: center;">Cảm ơn bạn đã mua sắm tại SaleSphere!</p>
            </div>
        `;

        await this.sendEmail({ to, subject: `[SaleSphere] Xác nhận thanh toán đơn hàng #${orderData.orderCode}`, html });
    }

    /**
     * Gửi email chào mừng thành viên mới
     */
    public async sendWelcomeEmail(to: string, name: string): Promise<void> {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
                <h2 style="color: #2196F3; text-align: center;">Chào mừng đến với SaleSphere!</h2>
                <p>Chào <strong>${name}</strong>,</p>
                <p>Cảm ơn bạn đã đăng ký thành viên tại SaleSphere. Chúng tôi rất vui mừng khi có bạn đồng hành.</p>
                <p>Hãy bắt đầu khám phá những cuốn sách tuyệt vời nhất tại cửa hàng của chúng tôi ngay hôm nay!</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://salesphere.com" style="background-color: #2196F3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">Mua sắm ngay</a>
                </div>
                <hr>
                <p style="font-size: 12px; color: #777; text-align: center;">Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại phản hồi email này.</p>
            </div>
        `;

        await this.sendEmail({ to, subject: `Chào mừng ${name} đến với SaleSphere!`, html });
    }
}
