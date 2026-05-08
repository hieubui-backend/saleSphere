const Joi = require('joi');
const OrderStatusEnum = require('../../domain/enums/OrderStatusEnum');

const checkoutSchema = Joi.object({
    shippingAddress: Joi.string().required().messages({
        'any.required': 'Địa chỉ giao hàng là bắt buộc',
        'string.empty': 'Địa chỉ giao hàng không được để trống'
    }),
    paymentMethod: Joi.string().valid('cod', 'vnpay', 'momo', 'bank_transfer').default('cod').messages({
        'any.only': 'Phương thức thanh toán không hợp lệ'
    }),
    region: Joi.string().valid('HA_NOI', 'MIEN_BAC', 'MIEN_TRUNG', 'MIEN_NAM', 'TP_HCM', 'DEFAULT').default('DEFAULT').messages({
         'any.only': 'Khu vực giao hàng không hợp lệ'
    })
});

const updateOrderStatusSchema = Joi.object({
    status: Joi.string().valid(...OrderStatusEnum.getAll()).required().messages({
        'any.only': 'Trạng thái đơn hàng không hợp lệ',
        'any.required': 'Trạng thái là bắt buộc'
    }),
    adminNote: Joi.string().allow('', null)
});

module.exports = {
    checkoutSchema,
    updateOrderStatusSchema
};
