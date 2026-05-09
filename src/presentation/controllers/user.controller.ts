import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { userUseCases } = req.container.cradle;
    const user = await userUseCases.register(req.body);
    res.status(201).json(user);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { userUseCases } = req.container.cradle;
    const result = await userUseCases.login(email, password);
    res.status(200).json(result);
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query;
    const { userUseCases } = req.container.cradle;
    const result = await userUseCases.getAllUsers({ 
        page: page ? Number(page) : undefined, 
        limit: limit ? Number(limit) : undefined 
    });
    res.status(200).json({
        success: true,
        total: result.count,
        data: result.users
    });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { userUseCases } = req.container.cradle;
    const user = await userUseCases.getUserById(req.params.id as string);
    if (!user) {
        res.status(404);
        throw new Error('Không tìm thấy người dùng');
    }
    res.json(user);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { userUseCases } = req.container.cradle;
    const updated = await userUseCases.updateUser(req.params.id as string, req.body);
    if (!updated) {
        res.status(404);
        throw new Error('Không tìm thấy người dùng');
    }
    res.json(updated);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { userUseCases } = req.container.cradle;
    await userUseCases.deleteUser(req.params.id as string);
    res.json({ message: 'Đã xóa nhân viên thành công' });
});





