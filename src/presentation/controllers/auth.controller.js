const asyncHandler = require('express-async-handler');

exports.getRegisterPage = (req, res) => {
    if (req.session.user) return res.redirect('/admin/dashboard');
    res.render('admin/register', { layout: false, error: null });
};

exports.handleRegister = asyncHandler(async (req, res) => {
    try {
        const { adminRegisterUseCase } = req.container.cradle;
        await adminRegisterUseCase.execute(req.body);
        res.redirect('/admin/login?message=registered_pending');
    } catch (error) {
        res.render('admin/register', { 
            layout: false, 
            error: error.message 
        });
    }
});

exports.getLoginPage = (req, res) => {
    if (req.session.user) {
        if (req.session.user.role === 'super_admin' || req.session.user.role === 'super-admin') {
            return res.redirect('/super-admin/dashboard');
        }
        return res.redirect('/admin/dashboard');
    }
    
    let message = null;
    if (req.query.message === 'registered_pending') {
        message = 'Đăng ký thành công! Cửa hàng của bạn đang chờ phê duyệt.';
    } else if (req.query.message === 'registered') {
        message = 'Đăng ký thành công! Vui lòng đăng nhập.';
    }

    res.render('admin/login', { layout: false, error: null, message });
};

exports.handleLogin = asyncHandler(async (req, res) => {
    try {
        const { adminLoginUseCase } = req.container.cradle;
        const userSession = await adminLoginUseCase.execute(req.body);
        
        req.session.user = userSession;
        
        req.session.save((err) => {
            if (err) throw err;
            if (userSession.role === 'super_admin' || userSession.role === 'super-admin') {
                return res.redirect('/super-admin/dashboard');
            }
            return res.redirect('/admin/dashboard');
        });
    } catch (error) {
        res.render('admin/login', { 
            layout: false, 
            error: error.message,
            message: null 
        });
    }
});

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
