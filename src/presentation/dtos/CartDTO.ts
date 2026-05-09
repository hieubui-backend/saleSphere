import Joi from 'joi';

export const addToCartSchema = Joi.object({
    productId: Joi.string().required().messages({
        'any.required': 'ID sản phẩm là bắt buộc',
        'string.empty': 'ID sản phẩm không được để trống'
    }),
    quantity: Joi.number().integer().min(1).default(1).messages({
        'number.base': 'Số lượng phải là số',
        'number.min': 'Số lượng phải từ 1 trở lên'
    })
});

export const updateCartQuantitySchema = Joi.object({
    productId: Joi.string().required().messages({
        'any.required': 'ID sản phẩm là bắt buộc',
        'string.empty': 'ID sản phẩm không được để trống'
    }),
    quantity: Joi.number().integer().required().messages({
        'number.base': 'Số lượng phải là số',
        'any.required': 'Số lượng là bắt buộc'
    })
});





