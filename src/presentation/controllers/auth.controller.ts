import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { sendResponse } from '../../utils/responseHelper';
import { toUserResponse } from '../dtos/UserDTO';

export const handleRegister = asyncHandler(async (req: Request, res: Response) => {
    const { adminRegisterUseCase } = req.container.cradle;
    const newUser = await adminRegisterUseCase.execute(req.body);
    sendResponse(res, 201, 'Đăng ký thành công', toUserResponse(newUser));
});

export const handleLogin = asyncHandler(async (req: Request, res: Response) => {
    const { adminLoginUseCase } = req.container.cradle;
    const userSession = await adminLoginUseCase.execute(req.body);
    
    req.session.user = userSession;
    
    const { tokenManager } = req.container.cradle;
    const token = tokenManager.generateToken(userSession);

    sendResponse(res, 200, 'Đăng nhập thành công', { user: toUserResponse(userSession), token });
});

export const handleLogout = (req: Request, res: Response) => {
    req.session.destroy((err: any) => {
        res.clearCookie('connect.sid');
        sendResponse(res, 200, 'Đăng xuất thành công');
    });
};





