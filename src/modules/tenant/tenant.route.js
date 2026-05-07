const express = require('express');
const router = express.Router();
const tenantController = require('../../presentation/controllers/tenant.controller');

// ==========================================
// CÁC ROUTE DÀNH CHO SELLER (ĐĂNG KÝ)
// ==========================================

// Hiển thị form đăng ký cho người bán
router.get('/register', (req, res) => {
    res.render('admin/register', { layout: false, error: null });
});

// Xử lý logic đăng ký shop mới
router.post('/register', tenantController.createTenant);

module.exports = router;