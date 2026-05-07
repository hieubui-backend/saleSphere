const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Dùng path.join và __dirname để trỏ chính xác ra thư mục public ở gốc dự án
        const dir = path.join(__dirname, '../../public/uploads/products');

        // Kiểm tra và tạo thư mục nếu chưa có
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Tạo tên file duy nhất để tránh trùng lặp khi nhiều shop cùng up ảnh
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Lấy đuôi file gốc (vd: .jpg, .png)
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

// Kiểm tra định dạng file
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file hình ảnh (jpg, png, jfif,...)!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn 5MB cho mỗi file
});

module.exports = upload;