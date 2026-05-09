import { Response } from 'express';

/**
 * Trả về JSON theo chuẩn chung cho toàn bộ API
 */
export const sendResponse = (
    res: Response, 
    statusCode: number, 
    message: string, 
    data: any = null, 
    meta: any = null
) => {
    const success = statusCode >= 200 && statusCode < 300;
    const response: any = {
        success,
        message,
    };

    if (data !== null) {
        response.data = data;
    }

    if (meta !== null) {
        response.meta = meta;
    }

    return res.status(statusCode).json(response);
};





