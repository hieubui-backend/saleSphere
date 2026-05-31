import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
    console.log("--- Đang kiểm tra kết nối SMTP ---");
    console.log("User:", process.env.MAIL_USERNAME);
    console.log("Host:", process.env.MAIL_HOST || 'smtp.gmail.com');
    console.log("Port:", process.env.MAIL_PORT || 587);

    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.MAIL_PORT) || 587,
        secure: process.env.MAIL_PORT === '465',
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
    });

    try {
        await transporter.verify();
        console.log("✅ Kết nối SMTP thành công! Tài khoản và mật khẩu hoàn toàn chính xác.");
    } catch (error) {
        console.error("❌ Lỗi kết nối SMTP:");
        console.error(error);
    }
}

testConnection();
