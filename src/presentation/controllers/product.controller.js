const asyncHandler = require('express-async-handler');

exports.getProducts = asyncHandler(async (req, res) => {
    const tenantId = req.session?.user?.tenantId || req.user?.tenantId;
    const { productUseCases } = req.container.cradle;
    const result = await productUseCases.getAllProducts(tenantId, req.query);
    
    if (req.accepts('html') && req.session?.user) {
        return res.render('products', { 
            title: 'Quản lý sản phẩm',
            products: result.products,
            count: result.count,
            userName: req.session.user.name,
            tenantId: tenantId
        });
    }

    res.status(200).json({ success: true, data: result.products });
});

exports.getCreateProductPage = (req, res) => {
    res.render('product-create', { 
        title: 'Thêm sản phẩm mới',
        userName: req.session.user.name,
        tenantId: req.session.user.tenantId,
        error: null,
        oldData: {} 
    });
};

exports.createProduct = asyncHandler(async (req, res) => {
    try {
        const tenantId = req.session?.user?.tenantId || req.user?.tenantId;
        const { productUseCases } = req.container.cradle;
        
        const productData = {
            ...req.body,
            price: Number(req.body.price) || 0,
            stock: Number(req.body.stock) || 0,
            tenantId: tenantId,
            isActive: true
        };

        if (req.files && req.files.length > 0) {
            productData.images = req.files.map(file => `/uploads/products/${file.filename}`);
            productData.image = `/uploads/products/${req.files[0].filename}`;
        } else {
            const defaultPath = '/images/default-product.png';
            productData.images = [defaultPath];
            productData.image = defaultPath;
        }

        const newProduct = await productUseCases.createProduct(productData);
        
        if (req.accepts('html')) {
            return res.redirect('/admin/products');
        }

        res.status(201).json({ success: true, data: newProduct });
        
    } catch (error) {
        if (req.accepts('html')) {
            return res.render('product-create', {
                title: 'Thêm sản phẩm mới',
                error: error.message || 'Có lỗi xảy ra',
                userName: req.session.user.name,
                tenantId: req.session.user.tenantId,
                oldData: req.body 
            });
        }
        res.status(400).json({ success: false, message: error.message });
    }
});

exports.getProductById = asyncHandler(async (req, res) => {
    const tenantId = req.session?.user?.tenantId || req.user?.tenantId;
    const { productUseCases } = req.container.cradle;
    const product = await productUseCases.getProductById(req.params.id, tenantId);
    
    if (!product) {
        if (req.accepts('html')) return res.status(404).render('errors/404', { layout: false });
        return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    if (req.accepts('html')) {
        return res.render('product-edit', { 
            title: 'Sửa sản phẩm',
            product,
            userName: req.session.user.name,
            tenantId: tenantId,
            error: null 
        });
    }

    res.status(200).json({ success: true, data: product });
});

exports.updateProduct = asyncHandler(async (req, res) => {
    try {
        const tenantId = req.session?.user?.tenantId || req.user?.tenantId;
        const { productUseCases } = req.container.cradle;
        const updateData = { ...req.body };
        
        if (updateData.price) updateData.price = Number(updateData.price);
        if (updateData.stock) updateData.stock = Number(updateData.stock);

        if (req.files && req.files.length > 0) {
            updateData.images = req.files.map(file => `/uploads/products/${file.filename}`);
            updateData.image = `/uploads/products/${req.files[0].filename}`;
        }

        const updatedProduct = await productUseCases.updateProduct(req.params.id, tenantId, updateData);
        
        if (req.accepts('html')) {
            return res.redirect('/admin/products');
        }

        res.status(200).json({ success: true, data: updatedProduct });
        
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

exports.deleteProduct = asyncHandler(async (req, res) => {
    const tenantId = req.session?.user?.tenantId || req.user?.tenantId;
    const { productUseCases } = req.container.cradle;
    await productUseCases.deleteProduct(req.params.id, tenantId);
    
    if (req.accepts('html')) {
        return res.redirect('/admin/products');
    }

    res.status(200).json({ success: true, message: 'Đã xóa sản phẩm thành công' });
});
