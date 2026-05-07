const User = require('../modules/user/user.model');
const Tenant = require('../modules/tenant/tenant.model');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');

/**
 * [GET] Hiển thị trang đăng ký
 * Đường dẫn View: views/admin/register.ejs
 */
exports.getRegisterPage = (req, res) => {
    // Nếu đã đăng nhập, chuyển hướng về dashboard
    if (req.session.user) return res.redirect('/admin/dashboard');
    
    // Trả về trang đăng ký, không dùng layout chung
    res.render('admin/register', { layout: false, error: null });
};

/**
 * [POST] Xử lý logic đăng ký Shop & Admin
 */
exports.handleRegister = asyncHandler(async (req, res) => {
    const { shopName, name, email, password } = req.body;
    
    // Kiểm tra xem email đã tồn tại chưa
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.render('admin/register', { 
            layout: false, 
            error: 'Email này đã được sử dụng!' 
        });
    }

    // Tạo slug từ tên cửa hàng (để làm sub-domain sau này)
    const slug = shopName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

    // 1. Tạo mới Tenant (Cửa hàng)
    const newTenant = await Tenant.create({ 
        name: shopName, 
        slug: slug, 
        isActive: false, // Chuyển thành false để chờ duyệt
        status: 'pending' // Thêm trạng thái chờ duyệt
    });
    
    // 2. Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Tạo mới User (Admin của cửa hàng)
    await User.create({
        name,
        email,
        password: hashedPassword,
        tenantId: newTenant._id, // Liên kết user với tenant
        role: 'admin' // Vai trò quản trị cửa hàng
    });

    // Chuyển hướng về trang đăng nhập với thông báo chờ duyệt
    res.redirect('/admin/login?message=registered_pending');
});

/**
 * [GET] Hiển thị trang đăng nhập
 * Đường dẫn View: views/admin/login.ejs
 */
exports.getLoginPage = (req, res) => {
    // Nếu đã đăng nhập, chuyển hướng về dashboard tương ứng
    if (req.session.user) {
        if (req.session.user.role === 'super_admin' || req.session.user.role === 'super-admin') {
            return res.redirect('/super-admin/dashboard');
        }
        return res.redirect('/admin/dashboard');
    }
    
    // Kiểm tra message từ query string
    let message = null;
    if (req.query.message === 'registered_pending') {
        message = 'Đăng ký thành công! Cửa hàng của bạn đang chờ phê duyệt.';
    } else if (req.query.message === 'registered') {
        message = 'Đăng ký thành công! Vui lòng đăng nhập.';
    }

    res.render('admin/login', { layout: false, error: null, message });
};

/**
 * [POST] Xử lý logic đăng nhập
 */
exports.handleLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // 1. Tìm user theo email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        
        // --- 2. XỬ LÝ CHO SUPER ADMIN ---
        if (user.role === 'super_admin' || user.role === 'super-admin') {
            req.session.user = { 
                id: user._id, 
                name: user.name, 
                tenantId: null, 
                tenantName: 'Hệ thống Quản trị',
                role: 'super_admin' 
            };

            return req.session.save((err) => {
                if (err) return next(err);
                return res.redirect('/super-admin/dashboard');
            });
        }

        // --- 3. XỬ LÝ CHO ADMIN CỬA HÀNG ---
        if (!user.tenantId) {
            return res.render('admin/login', { 
                layout: false, 
                error: 'Tài khoản không thuộc cửa hàng nào!',
                message: null 
            });
        }

        const tenant = await Tenant.findById(user.tenantId).lean();
        
        // Kiểm tra trạng thái hoạt động của cửa hàng
        if (!tenant || tenant.isActive === false) {
            return res.render('admin/login', { 
                layout: false, 
                error: 'Cửa hàng của bạn đã bị khóa hoặc ngừng hoạt động!',
                message: null
            });
        }

        // Thiết lập session cho Admin Shop
        req.session.user = { 
            id: user._id, 
            name: user.name, 
            tenantId: user.tenantId, 
            tenantName: tenant.name,
            role: user.role 
        };
        
        return req.session.save((err) => {
            if (err) return next(err);
            return res.redirect('/admin/dashboard');
        });
    }
    
    // Sai thông tin đăng nhập
    res.render('admin/login', { 
        layout: false, 
        error: 'Email hoặc mật khẩu không chính xác!',
        message: null 
    });
});

/**
 * [GET] Đăng xuất
 */
exports.handleLogout = (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).send('Không thể đăng xuất');
            }
            res.clearCookie('connect.sid');
            res.redirect('/admin/login');
        });
    } else {
        res.redirect('/admin/login');
    }
};