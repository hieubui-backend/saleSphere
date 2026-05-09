import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { sendResponse } from '../../utils/responseHelper';
import CustomerRegisterUseCase from '../../application/use-cases/auth/CustomerRegisterUseCase';
import CustomerLoginUseCase from '../../application/use-cases/auth/CustomerLoginUseCase';
import CustomerRepository from '../../infrastructure/repositories/CustomerRepository';
import CustomerUseCases from '../../application/use-cases/customer/CustomerUseCases';

// ==========================================
// API DÀNH CHO CUSTOMER (CLIENT REACT/MOBILE)
// ==========================================

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { customerRegisterUseCase } = req.container.cradle;
    const customer = await customerRegisterUseCase.execute(req.body);
    sendResponse(res, 201, 'Đăng ký tài khoản thành công', customer);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { customerLoginUseCase } = req.container.cradle;
    const data = await customerLoginUseCase.execute(req.body);
    
    // Lưu thông tin vào session nếu cần (hoặc dùng JWT)
    req.session.customer = data.customer;
    
    sendResponse(res, 200, 'Đăng nhập thành công', data);
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
    const { customerRepository } = req.container.cradle;
    const customer = await customerRepository.findById((req as any).user.id as string);
    if (!customer) {
        res.status(404).json({ success: false, message: 'Không tìm thấy thông tin' });
        return;
    }
    
    const customerData: any = { ...customer };
    delete customerData.password;
    
    sendResponse(res, 200, 'Lấy thông tin thành công', customerData);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const { customerUseCases } = req.container.cradle;
    const customer = await customerUseCases.updateCustomer((req as any).user.id as string, req.body);
    
    const customerData: any = { ...customer };
    delete customerData.password;

    sendResponse(res, 200, 'Cập nhật thông tin thành công', customerData);
});

// ==========================================
// API DÀNH CHO ADMIN (QUẢN LÝ CUSTOMERS)
// ==========================================

export const getAllCustomers = asyncHandler(async (req: Request, res: Response) => {
    const { customerUseCases } = req.container.cradle;
    const customers = await customerUseCases.getAllCustomers(req.query);
    
    const safeCustomers = customers.map(c => {
        const copy: any = { ...c };
        delete copy.password;
        return copy;
    });

    sendResponse(res, 200, 'Thành công', safeCustomers);
});

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
    const { customerUseCases } = req.container.cradle;
    const customer = await customerUseCases.createCustomer(req.body);
    
    const customerData: any = { ...customer };
    delete customerData.password;

    sendResponse(res, 201, 'Tạo khách hàng thành công', customerData);
});


export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
    const { customerUseCases } = req.container.cradle;
    const customer = await customerUseCases.updateCustomer(req.params.id as string, req.body);
    
    const customerData: any = { ...customer };
    delete customerData.password;

    sendResponse(res, 200, 'Cập nhật khách hàng thành công', customerData);
});

export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
    const { customerUseCases } = req.container.cradle;
    await customerUseCases.deleteCustomer(req.params.id as string);
    sendResponse(res, 200, 'Đã xóa người mua thành công');
});






