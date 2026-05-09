import { Request, Response, NextFunction } from 'express';
import logger from '../infrastructure/logging/logger';
import AppError from '../infrastructure/errors/AppError';
import { sendResponse } from '../utils/responseHelper';

const handleCastErrorDB = (err: any) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: any) => {
    const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)?.[0] : 'Giá trị';
    const message = `Dữ liệu bị trùng lặp: ${value}. Vui lòng sử dụng giá trị khác!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err: any) => {
    const errors = Object.values(err.errors).map((el: any) => el.message);
    const message = `Dữ liệu không hợp lệ. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Token không hợp lệ. Vui lòng đăng nhập lại!', 401);
const handleJWTExpiredError = () => new AppError('Token đã hết hạn. Vui lòng đăng nhập lại!', 401);

const sendErrorDev = (err: any, req: Request, res: Response) => {
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            error: err,
            stack: err.stack
        });
    }

    logger.error('ERROR 💥: %O', err);
    return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        error: err,
        stack: err.stack
    });
};

const sendErrorProd = (err: any, req: Request, res: Response) => {
    if (req.originalUrl.startsWith('/api')) {
        if (err.isOperational) {
            return sendResponse(res, err.statusCode, err.message);
        }
        
        logger.error('ERROR 💥: %O', err);
        return sendResponse(res, 500, 'Đã xảy ra lỗi trên server!');
    }

    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }

    logger.error('ERROR 💥: %O', err);
    return res.status(err.statusCode).json({
        success: false,
        message: 'Đã xảy ra lỗi trên server! Vui lòng thử lại sau.'
    });
};

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else {
        let error = { ...err };
        error.message = err.message;
        error.name = err.name;

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }
};

export default errorHandler;





