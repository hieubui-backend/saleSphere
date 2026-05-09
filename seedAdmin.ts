import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Sử dụng model từ đúng đường dẫn
import User from './src/infrastructure/database/models/user.model';

const seedSuperAdmin = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('Lỗi: Chưa cấu hình MONGO_URI trong file .env');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('--- Đã kết nối MongoDB ---');

        const adminEmail = 'admin@salesphere.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log(`Tài khoản ${adminEmail} đã tồn tại trong hệ thống.`);
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123456', salt);

        const superAdmin = new User({
            name: 'He Thong Quan Tri',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin'
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
