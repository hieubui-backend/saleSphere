import { Request, Response, NextFunction } from 'express';
import AppError from '../infrastructure/errors/AppError';
import { productValidationSchema } from '../presentation/dtos/ProductDTO';
import { userRegisterSchema, userLoginSchema } from '../presentation/dtos/UserDTO';
import { customerRegisterSchema, customerLoginSchema } from '../presentation/dtos/CustomerDTO';

export const validateProduct = (req: Request, res: Response, next: NextFunction) => {
    if (req.body.price !== undefined) req.body.price = (req.body.price === '') ? 0 : Number(req.body.price);
    if (req.body.stock !== undefined) req.body.stock = (req.body.stock === '') ? 0 : Number(req.body.stock);

    const { error, value } = productValidationSchema.validate(req.body, { abortEarly: false, convert: true });
    
    if (error) {
        const errorMessage = error.details[0].message;
        
        if (req.accepts('html') && !req.xhr && !req.originalUrl.startsWith('/api')) {
            const isEdit = req.path.includes('edit'); 
            const viewName = isEdit ? 'product-edit' : 'product-create'; 
            const userName = req.session?.user?.name || 'Admin';

            res.status(400).render(viewName, {
                title: isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới',
                error: errorMessage,
                userName,
                product: isEdit ? { ...req.body, _id: req.params.id } : null,
                oldData: req.body 
            });
            return;
        }
        
        return next(new AppError(errorMessage, 400));
    }
    
    req.body = value;
    next();
};

export const validateCustomerRegister = (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = customerRegisterSchema.validate(req.body, { abortEarly: false, convert: true });
    if (error) {
        const msg = error.details.map(d => d.message).join(', ');
        return next(new AppError(msg, 400));
    }
    req.body = value;
    next();
};

export const validateCustomerLogin = (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = customerLoginSchema.validate(req.body, { abortEarly: false, convert: true });
    if (error) {
        const msg = error.details[0].message;
        return next(new AppError(msg, 400));
    }
    req.body = value;
    next();
};
export const validateUserRegister = (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = userRegisterSchema.validate(req.body, { abortEarly: false, convert: true });
    if (error) {
        const msg = error.details.map(d => d.message).join(', ');
        return next(new AppError(msg, 400));
    }
    req.body = value;
    next();
};

export const validateUserLogin = (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = userLoginSchema.validate(req.body, { abortEarly: false, convert: true });
    if (error) {
        const msg = error.details[0].message;
        return next(new AppError(msg, 400));
    }
    req.body = value;
    next();
};
