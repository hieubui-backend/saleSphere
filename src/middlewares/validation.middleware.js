const Joi = require('joi');

// 1. Schema cho Sản phẩm
const productSchema = Joi.object({
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
}).unknown(true); // Cho phép các trường khác như images không bị lỗi validation

// 2. Schema cho Đăng ký User (Dùng cho API hoặc Admin Panel)
const userRegisterSchema = Joi.object({
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
    tenantId: Joi.string().optional(), // Có thể bổ sung sau khi tạo Tenant
    role: Joi.string().valid('admin', 'staff').default('staff')
});

// --- CÁC HÀM MIDDLEWARE THỰC THI ---

/**
 * Middleware Validate Sản phẩm
 * Tự động render lại View kèm thông báo lỗi nếu dữ liệu sai
 */
const validateProduct = (req, res, next) => {
    // ÉP KIỂU THỦ CÔNG: Xử lý chuỗi từ Form-data gửi lên
    if (req.body.price !== undefined) {
        req.body.price = (req.body.price === '') ? 0 : Number(req.body.price);
    }
    if (req.body.stock !== undefined) {
        req.body.stock = (req.body.stock === '') ? 0 : Number(req.body.stock);
    }

    const { error, value } = productSchema.validate(req.body, { 
        abortEarly: false,
        convert: true 
    });
    
    if (error) {
        const errorMessage = error.details[0].message;
        
        // KIỂM TRA NẾU LÀ YÊU CẦU TỪ TRÌNH DUYỆT (HTML)
        if (req.accepts('html')) {
            const isEdit = req.path.includes('edit'); 
            const viewName = isEdit ? 'product-edit' : 'product-create'; 
            
            const userName = req.session.user ? req.session.user.name : 'Admin';
            const tenantId = req.session.user ? req.session.user.tenantId : '';

            // Quan trọng: Khi render lại trang Edit, cần object 'product' để không lỗi EJS
            return res.status(400).render(viewName, {
                title: isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới',
                error: errorMessage,
                userName: userName,
                tenantId: tenantId,
                // Giữ lại dữ liệu cũ để người dùng không phải nhập lại
                product: isEdit ? { ...req.body, _id: req.params.id } : null,
                oldData: req.body 
            });
        }
        
        // TRẢ VỀ JSON NẾU LÀ GỌI API
        return res.status(400).json({ success: false, message: errorMessage });
    }
    
    req.body = value; // Gán lại dữ liệu đã qua xử lý (trim, convert type) cho body
    next();
};

const validateUserRegister = (req, res, next) => {
    const { error } = userRegisterSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const msg = error.details.map(d => d.message).join(', ');
        return res.status(400).json({ success: false, message: msg });
    }
    next();
};

module.exports = { 
    validateProduct, 
    validateUserRegister 
};