import Joi from 'joi';

export const userRegisterSchema = Joi.object({
    name: Joi.string().min(2).required().messages({
        'string.min': 'Tên phải từ 2 ký tự trở lên',
        'any.required': 'Tên là bắt buộc'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Email không hợp lệ',
        'any.required': 'Email là bắt buộc'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Mật khẩu phải từ 6 ký tự trở lên',
        'any.required': 'Mật khẩu là bắt buộc'
    }),
    role: Joi.string().valid('admin', 'staff').default('admin')
});

export const userLoginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email không hợp lệ',
        'any.required': 'Email là bắt buộc'
    }),
    password: Joi.string().required().messages({
        'any.required': 'Mật khẩu là bắt buộc'
    })
});

export const toUserResponse = (user: any) => {
    if (!user) return null;
    return {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
    };
};





