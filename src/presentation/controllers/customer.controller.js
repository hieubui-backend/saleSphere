const asyncHandler = require('express-async-handler');
const { sendResponse } = require('../../utils/responseHelper');

// ==========================================
// API DÀNH CHO CUSTOMER (CLIENT REACT)
// ==========================================

exports.register = asyncHandler(async (req, res) => {
    const { customerRegisterUseCase } = req.container.cradle;
    const customer = await customerRegisterUseCase.execute(req.body);
    sendResponse(res, 201, 'Đăng ký tài khoản thành công', customer);
});

exports.login = asyncHandler(async (req, res) => {
    const { customerLoginUseCase } = req.container.cradle;
    const data = await customerLoginUseCase.execute(req.body);
    sendResponse(res, 200, 'Đăng nhập thành công', data);
});

exports.getProfile = asyncHandler(async (req, res) => {
    const { customerRepository } = req.container.cradle;
    // req.user được set bởi auth middleware (JWT)
    const customer = await customerRepository.findById(req.user.id);
    if (!customer) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin' });
    }
    
    const customerData = customer.toObject ? customer.toObject() : customer;
    delete customerData.password;
    
    sendResponse(res, 200, 'Lấy thông tin thành công', customerData);
});

exports.updateProfile = asyncHandler(async (req, res) => {
    const { customerUseCases } = req.container.cradle;
    const customer = await customerUseCases.updateCustomer(req.user.id, req.body);
    
    const customerData = customer.toObject ? customer.toObject() : customer;
    delete customerData.password;

    sendResponse(res, 200, 'Cập nhật thông tin thành công', customerData);
});

// ==========================================
// API DÀNH CHO ADMIN (QUẢN LÝ CUSTOMERS)
// ==========================================

exports.getAllCustomers = asyncHandler(async (req, res) => {
    const { customerUseCases } = req.container.cradle;
    const customers = await customerUseCases.getAllCustomers(req.query);
    
    // Remove passwords before sending to admin
    const safeCustomers = customers.map(c => {
        const copy = { ...c };
        delete copy.password;
        return copy;
    });

    sendResponse(res, 200, 'Thành công', safeCustomers);
});

exports.createCustomer = asyncHandler(async (req, res) => {
    const { customerUseCases } = req.container.cradle;
    const customer = await customerUseCases.createCustomer(req.body);
    
    const customerData = customer.toObject ? customer.toObject() : customer;
    delete customerData.password;

    sendResponse(res, 201, 'Tạo khách hàng thành công', customerData);
});

exports.updateCustomer = asyncHandler(async (req, res) => {
    const { customerUseCases } = req.container.cradle;
    const customer = await customerUseCases.updateCustomer(req.params.id, req.body);
    
    const customerData = customer.toObject ? customer.toObject() : customer;
    delete customerData.password;

    sendResponse(res, 200, 'Cập nhật khách hàng thành công', customerData);
});

exports.deleteCustomer = asyncHandler(async (req, res) => {
    const { customerUseCases } = req.container.cradle;
    await customerUseCases.deleteCustomer(req.params.id);
    sendResponse(res, 200, 'Đã xóa người mua thành công');
});
