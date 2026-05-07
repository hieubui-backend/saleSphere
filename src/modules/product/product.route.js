const express = require('express');
const router = express.Router();
const productController = require('../../presentation/controllers/product.controller');
const { protect, checkRole } = require('../../middlewares/auth.middleware');
const { validateProduct } = require('../../middlewares/validation.middleware');
const upload = require('../../middlewares/upload.middleware');

// --- TẤT CẢ ROUTE ĐỀU CẦN ĐĂNG NHẬP (protect) ---

// 1. Lấy danh sách sản phẩm
router.get('/', protect, productController.getProducts);

// 2. Lấy chi tiết 1 sản phẩm
router.get('/:id', protect, productController.getProductById);

// --- CÁC ROUTE CHỈ DÀNH CHO ADMIN ---

/**
 * 3. Tạo sản phẩm mới
 * upload.array đặt TRƯỚC validateProduct để bóc tách req.body từ form-data
 */
router.post(
    '/create', // Chỉnh lại path cho khớp với form action của bạn
    protect, 
    checkRole(['admin']), 
    upload.array('images', 5), 
    validateProduct, 
    productController.createProduct
);

/**
 * 4. Cập nhật sản phẩm
 */
router.put(
    '/:id', 
    protect, 
    checkRole(['admin']), 
    upload.array('images', 5), 
    validateProduct, 
    productController.updateProduct
);

// 5. Xóa sản phẩm
router.delete(
    '/:id', 
    protect, 
    checkRole(['admin']), 
    productController.deleteProduct
);

module.exports = router;