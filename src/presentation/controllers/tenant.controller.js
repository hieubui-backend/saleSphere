const asyncHandler = require('express-async-handler');

exports.createTenant = asyncHandler(async (req, res) => {
    const { tenantUseCases } = req.container.cradle;
    const tenant = await tenantUseCases.createTenant(req.body);
    res.status(201).json({ success: true, tenant });
});

exports.updateTenant = asyncHandler(async (req, res) => {
    const { tenantUseCases } = req.container.cradle;
    const tenant = await tenantUseCases.updateTenant(req.params.id, req.body);
    res.json({ success: true, tenant });
});

exports.deleteTenant = asyncHandler(async (req, res) => {
    const { tenantUseCases } = req.container.cradle;
    await tenantUseCases.deleteTenant(req.params.id);
    res.json({ success: true, message: 'Đã xóa cửa hàng.' });
});

exports.getAllTenants = asyncHandler(async (req, res) => {
    const { tenantUseCases } = req.container.cradle;
    const tenants = await tenantUseCases.getAllTenants();
    const totalTenants = tenants.length;

    res.render('super-admin/tenants', { 
        title: 'Quản lý danh sách cửa hàng',
        tenants,
        totalTenants,
        user: req.session.user
    });
});

exports.toggleTenantStatus = asyncHandler(async (req, res) => {
    const { tenantUseCases } = req.container.cradle;
    await tenantUseCases.toggleTenantStatus(req.params.id);
    res.redirect('/super-admin/tenants');
});
