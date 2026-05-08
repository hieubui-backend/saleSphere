const Joi = require('joi');

const productValidationSchema = Joi.object({
    name: Joi.string().trim().min(3).required().messages({
        'string.empty': 'Tên sản phẩm không được để trống',
        'string.min': 'Tên sản phẩm phải có ít nhất 3 ký tự',
        'any.required': 'Tên sản phẩm là bắt buộc'
    }),
    price: Joi.number().min(0).required().messages({
        'number.base': 'Giá bán phải là một con số',
        'number.min': 'Giá bán không được nhỏ hơn 0',
        'any.required': 'Giá bán là bắt buộc'
    }),
    stock: Joi.number().integer().min(0).required().messages({
        'number.base': 'Số lượng tồn kho phải là số',
        'number.min': 'Tồn kho không được nhỏ hơn 0',
        'any.required': 'Số lượng tồn kho là bắt buộc'
    }),
    description: Joi.string().trim().allow('', null).default(''),
    category: Joi.string().trim().required().messages({
        'any.required': 'Danh mục là bắt buộc',
        'string.empty': 'Vui lòng chọn hoặc nhập danh mục'
    })
}).unknown(true); // Cho phép các trường khác như images, variants

// Response DTO: Lọc dữ liệu trước khi trả về Client
const toProductResponse = (product) => {
    return {
        id: product._id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        description: product.description,
        images: product.images,
        category: product.category,
        isActive: product.isActive,
        createdAt: product.createdAt
    };
};

const toProductListResponse = (products) => {
    return products.map(toProductResponse);
};

module.exports = {
    productValidationSchema,
    toProductResponse,
    toProductListResponse
};
