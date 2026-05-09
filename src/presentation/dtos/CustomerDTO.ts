import Joi from 'joi';

export const customerRegisterSchema = Joi.object({
    name: Joi.string().min(2).required().messages({
        'string.min': 'Tên phải từ 2 ký tự trở lên',
        'any.required': 'Tên là bắt buộc',
        'string.empty': 'Tên không được để trống'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Email không hợp lệ',
        'any.required': 'Email là bắt buộc',
        'string.empty': 'Email không được để trống'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Mật khẩu phải từ 6 ký tự trở lên',
        'any.required': 'Mật khẩu là bắt buộc',
        'string.empty': 'Mật khẩu không được để trống'
    }),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/).allow('', null).messages({
        'string.pattern.base': 'Số điện thoại phải từ 10-11 số'
    }),
    address: Joi.string().allow('', null)
});

export const customerLoginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email không hợp lệ',
        'any.required': 'Email là bắt buộc'
    }),
    password: Joi.string().required().messages({
        'any.required': 'Mật khẩu là bắt buộc'
    })
});

export const customerUpdateSchema = Joi.object({
    name: Joi.string().min(2).messages({
        'string.min': 'Tên phải từ 2 ký tự trở lên'
    }),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/).allow('', null).messages({
        'string.pattern.base': 'Số điện thoại phải từ 10-11 số'
    }),
    address: Joi.string().allow('', null)
});





