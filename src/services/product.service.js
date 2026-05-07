const Product = require('../modules/product/product.model');

// 1. Lấy tất cả sản phẩm (Phân trang & Tìm kiếm)
const getAllProducts = async (tenantId, { page = 1, limit = 10, search }) => {
    const query = { tenantId, isActive: true };
    if (search) query.name = { $regex: search, $options: 'i' };

    const products = await Product.find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
        .lean();

    const count = await Product.countDocuments(query);
    return { products, count };
};

// 2. Lấy chi tiết 1 sản phẩm
const getProductById = async (id, tenantId) => {
    return await Product.findOne({ _id: id, tenantId });
};

// 3. Tạo sản phẩm mới (Đã sửa lỗi NaN triệt để)
const createProduct = async (productData) => {
    const cleanData = {
        ...productData,
        name: productData.name ? productData.name.trim() : "",
        price: Number(productData.price) || 0,
        stock: Number(productData.stock) || 0,
        images: productData.images && productData.images.length > 0 
                ? productData.images 
                : ['/images/default-product.png']
    };

    if (!cleanData.name) {
        throw new Error('Tên sản phẩm không được để trống');
    }

    const product = new Product(cleanData);
    return await product.save();
};

// 4. Cập nhật sản phẩm
const updateProduct = async (id, tenantId, updateData) => {
    const formattedUpdate = { ...updateData };
    
    if (formattedUpdate.price !== undefined) formattedUpdate.price = Number(formattedUpdate.price) || 0;
    if (formattedUpdate.stock !== undefined) formattedUpdate.stock = Number(formattedUpdate.stock) || 0;
    if (formattedUpdate.name) formattedUpdate.name = formattedUpdate.name.trim();

    return await Product.findOneAndUpdate(
        { _id: id, tenantId },
        formattedUpdate,
        { new: true, runValidators: true }
    );
};

// 5. Xóa sản phẩm
const deleteProduct = async (id, tenantId) => {
    return await Product.findOneAndDelete({ _id: id, tenantId });
};

module.exports = {
    getAllProducts,
    getProductById, 
    createProduct,
    updateProduct,
    deleteProduct
};