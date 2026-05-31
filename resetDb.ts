import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const resetDatabase = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('❌ Lỗi: Chưa cấu hình MONGO_URI trong file .env');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('--- Đã kết nối MongoDB ---');

        // Xóa toàn bộ database hiện tại
        if (mongoose.connection.db) {
            await mongoose.connection.db.dropDatabase();
            console.log('✅ Đã xóa toàn bộ database thành công! Bạn có thể bắt đầu lưu dữ liệu mới.');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi xóa Database:', error);
        process.exit(1);
    }
};

resetDatabase();