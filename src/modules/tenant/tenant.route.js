const express = require('express');
const router = express.Router();
const Tenant = require('./tenant.model');

// ==========================================
// CÁC ROUTE DÀNH CHO SELLER (ĐĂNG KÝ)
// ==========================================

// Hiển thị form đăng ký cho người bán
router.get('/register', (req, res) => {
    // SỬA LỖI: Thay 'seller/register' bằng 'admin/register' để khớp với cấu trúc thư mục
    res.render('admin/register', { layout: false, error: null });
});

// Xử lý logic đăng ký shop mới
router.post('/register', async (req, res) => {
    try {
        const { name, shopName, email, password } = req.body;
        
        const existingTenant = await Tenant.findOne({ $or: [{ email }, { name }] });
        if (existingTenant) {
            return res.status(400).json({ success: false, message: "Email hoặc tên công ty đã tồn tại" });
        }

        // Tạo slug tự động
        const slug = name.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d").replace(/[^\w\s-]/g, "")
            .trim().replace(/\s+/g, "-");

        const newTenant = new Tenant({ 
            name: shopName, // Dùng shopName làm tên shop, name làm tên chủ shop (nếu cần tách biệt)
            email, 
            password, 
            slug,
            isActive: false, 
            status: 'pending' 
        });

        await newTenant.save();
        
        res.status(201).json({ 
            success: true, 
            message: "Đăng ký thành công! Vui lòng đợi hệ thống phê duyệt (thường mất 24h)." 
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

module.exports = router;