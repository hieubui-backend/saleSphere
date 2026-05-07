// seedAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/modules/user/user.model'); 

const seedSuperAdmin = async () => {
    try {
        // 1. Kết nối Database
        if (!process.env.MONGO_URI) {
            console.error('Lỗi: Chưa cấu hình MONGO_URI trong file .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- Đã kết nối MongoDB ---');

        // 2. Kiểm tra xem tài khoản admin đã tồn tại chưa
        const adminEmail = 'admin@salesphere.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log(`Tài khoản ${adminEmail} đã tồn tại trong hệ thống.`);
            process.exit(0);
        }

        // 3. Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123456', salt);

        // 4. Tạo tài khoản Super Admin
        const superAdmin = new User({
            name: 'Hệ Thống Quản Trị',
            email: adminEmail,
            password: hashedPassword,
            role: 'super_admin', // Quyền cao nhất bạn đã cấu hình trong layout
            tenantId: null       // Admin sàn không thuộc về shop nào cụ thể
        });

        await superAdmin.save();

        console.log('==========================================');
        console.log('   TẠO TÀI KHOẢN ADMIN TỔNG THÀNH CÔNG    ');
        console.log(`   Email: ${adminEmail}               `);
        console.log('   Password: admin123456                ');
        console.log('==========================================');
        
        process.exit(0);
    } catch (error) {
        console.error('Lỗi khi chạy Seed Admin:', error);
        process.exit(1);
    }
};

seedSuperAdmin();