import Joi from 'joi';

const ALLOWED_CATEGORIES = ['Tiểu thuyết', 'Khoa học', 'Lịch sử', 'Kỹ năng sống', 'Truyện tranh'];

export const productValidationSchema = Joi.object({
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
    category: Joi.string().trim().valid(...ALLOWED_CATEGORIES).required().messages({
        'any.required': 'Danh mục là bắt buộc',
        'string.empty': 'Vui lòng chọn hoặc nhập danh mục',
        'any.only': 'Thể loại sách không hợp lệ'
    })
}).unknown(true);

export const toProductResponse = (product: any) => {
    const baseUrl = process.env.SERVER_URL || 'http://localhost:5000';

    return {
        id: product._id || product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        description: product.description,
        images: product.images?.map((img: string) => img.startsWith('http') ? img : `${baseUrl}${img}`) || [],
        category: product.category,
        isActive: product.isActive,
        createdAt: product.createdAt
    };
};

export const toProductListResponse = (products: any[]) => {
    return products.map(toProductResponse);
};
