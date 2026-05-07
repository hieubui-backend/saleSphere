// ==========================================
// TRONG FILE: src/controllers/tenant.controller.js
// ==========================================

// --- IMPORT LIBRARIES & MODELS ---
const Tenant = require('../modules/tenant/tenant.model');
const asyncHandler = require('express-async-handler');

// ==========================================
// 1. DÀNH CHO API (CREATE, UPDATE, DELETE)
// ==========================================

// Thêm cửa hàng
exports.createTenant = asyncHandler(async (req, res) => {
    const { name, shopName, email, password, slug } = req.body;
    
    // Kiểm tra trùng lặp email hoặc slug
    const existing = await Tenant.findOne({ $or: [{ email }, { slug }] });
    if (existing) {
        return res.status(400).json({ success: false, message: 'Email hoặc slug đã tồn tại!' });
    }

    const tenant = new Tenant({ 
        name, 
        shopName, 
        email, 
        password, // Lưu ý: Nên hash password trong model trước khi lưu
        slug, 
        isActive: true, 
        status: 'active' 
    });

    await tenant.save();
    res.status(201).json({ success: true, tenant });
});

// Sửa cửa hàng
exports.updateTenant = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, shopName, email, slug } = req.body;
    
    const tenant = await Tenant.findByIdAndUpdate(
        id, 
        { name, shopName, email, slug }, 
        { new: true, runValidators: true }
    );
    
    if (!tenant) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy cửa hàng!' });
    }
    
    res.json({ success: true, tenant });
});

// Xóa cửa hàng
exports.deleteTenant = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const tenant = await Tenant.findByIdAndDelete(id);
    
    if (!tenant) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy cửa hàng!' });
    }
    
    res.json({ success: true, message: 'Đã xóa cửa hàng.' });
});

// ==========================================
// 2. DÀNH CHO VIEW TRÌNH DUYỆT (ADMIN PANEL)
// ==========================================

/**
 * @desc    Lấy danh sách tất cả cửa hàng (Dùng cho Super Admin)
 * @route   GET /super-admin/tenants
 */
exports.getAllTenants = asyncHandler(async (req, res) => {
    const tenants = await Tenant.find().sort({ createdAt: -1 });
    
    // Đếm tổng số đối tác để hiển thị lên giao diện
    const totalTenants = tenants.length;

    res.render('super-admin/tenants', { 
        title: 'Quản lý danh sách cửa hàng',
        tenants,
        totalTenants,
        user: req.session.user // Để hiển thị thông tin Admin trên header
    });
});

/**
 * @desc    Khóa hoặc Mở khóa cửa hàng (Toggle status)
 * @route   GET /super-admin/tenants/toggle/:id
 */
exports.toggleTenantStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
        // Redirect kèm flash message báo lỗi
        return res.redirect('/super-admin/tenants?error=notfound');
    }

    // Đảo ngược trạng thái isActive (Khóa thành Mở, Mở thành Khóa)
    tenant.isActive = !tenant.isActive;
    
    // Cập nhật status tương ứng
    tenant.status = tenant.isActive ? 'active' : 'blocked';
    
    await tenant.save();

    // Sau khi xử lý xong, quay lại trang danh sách
    res.redirect('/super-admin/tenants');
});