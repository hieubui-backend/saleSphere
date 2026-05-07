const express = require('express');
const router = express.Router();
const Customer = require('./customer.model');
const Product = require('../../infrastructure/database/models/product.model');
const Order = require('../order/order.model');
const Cart = require('../Cart'); 
const bcrypt = require('bcryptjs');

const customerController = require('../../controllers/customer.controller');
const { isAuthenticated } = require('../../middlewares/auth.middleware');

// --- IMPORT SERVICE ---
const orderService = require('../../services/order.service'); 

/**
 * MIDDLEWARE: Kiểm tra đăng nhập Khách hàng
 */
const isCustomerAuthenticated = (req, res, next) => {
    if (req.session.customer && (req.session.customer.id || req.session.customer._id)) return next();
    
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(401).json({ success: false, message: "Phiên đăng nhập hết hạn!" });
    }
    res.redirect('/customer/login');
};

// ==========================================
// 1. XÁC THỰC (AUTH)
// ==========================================

// Trang đăng nhập
router.get('/login', (req, res) => res.render('customer/login', { layout: false, error: null }));

// Xử lý đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const customer = await Customer.findOne({ email });
        if (customer && (await bcrypt.compare(password, customer.password))) {
            req.session.customer = { 
                id: customer._id, 
                _id: customer._id, 
                name: customer.name, 
                email: customer.email,
                tenantId: customer.tenantId 
            };
            return res.redirect('/customer/home'); 
        }
        res.render('customer/login', { layout: false, error: 'Tài khoản hoặc mật khẩu không chính xác!' });
    } catch (error) { 
        res.status(500).send("Lỗi server khi đăng nhập."); 
    }
});

// Trang đăng ký
router.get('/register', (req, res) => res.render('customer/register', { layout: false, error: null }));

// XỬ LÝ ĐĂNG KÝ (FIX LỖI 404)
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Kiểm tra email tồn tại
        const existingCustomer = await Customer.findOne({ email });
        if (existingCustomer) {
            return res.render('customer/register', { layout: false, error: 'Email đã được sử dụng!' });
        }

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Lưu khách hàng mới
        const newCustomer = new Customer({
            name,
            email,
            password: hashedPassword
        });
        await newCustomer.save();

        // Đăng ký xong chuyển về trang đăng nhập
        res.redirect('/customer/login');
    } catch (error) {
        console.error("Lỗi đăng ký:", error);
        res.render('customer/register', { layout: false, error: 'Lỗi hệ thống khi đăng ký.' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/customer/home');
});

// ==========================================
// 2. TRANG CHỦ & SẢN PHẨM
// ==========================================
router.get('/home', async (req, res) => {
    try {
        const products = await Product.find({ isActive: true }).lean();
        res.render('customer/home', { 
            layout: false, 
            products, 
            customer: req.session.customer || null,
            selectedCategory: req.query.category || 'Tất cả'
        });
    } catch (error) { 
        res.status(500).send("Không thể tải trang chủ."); 
    }
});

// ==========================================
// 3. GIỎ HÀNG (CART)
// ==========================================
router.get('/cart', isCustomerAuthenticated, async (req, res) => {
    try {
        const customerId = req.session.customer.id || req.session.customer._id;
        const cart = await Cart.findOne({ customerId }).populate('items.productId');
        res.render('customer/cart', { 
            layout: false, 
            cart: cart || { items: [] }, 
            customer: req.session.customer 
        });
    } catch (error) { 
        res.status(500).send("Lỗi tải giỏ hàng."); 
    }
});

router.post('/cart/update', isCustomerAuthenticated, async (req, res) => {
    try {
        const { productId, change } = req.body;
        const customerId = req.session.customer.id || req.session.customer._id;

        const cart = await Cart.findOne({ customerId });
        if (!cart) return res.status(404).json({ success: false, message: "Giỏ hàng không tồn tại" });

        const itemIndex = cart.items.findIndex(p => p.productId && p.productId.toString() === productId);

        if (itemIndex > -1) {
            if (change > 0) {
                const product = await Product.findById(productId);
                if (product && cart.items[itemIndex].quantity + parseInt(change) > product.stock) {
                    return res.status(400).json({ success: false, message: "Vượt quá số lượng tồn kho!" });
                }
            }

            cart.items[itemIndex].quantity += parseInt(change);

            if (cart.items[itemIndex].quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            }

            await cart.save();
            return res.json({ success: true });
        }
        res.status(400).json({ success: false, message: "Sản phẩm không có trong giỏ" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/cart/add', isCustomerAuthenticated, async (req, res) => {
    try {
        const { productId, tenantId, price, quantity = 1 } = req.body;
        const customerId = req.session.customer.id || req.session.customer._id;
        
        let cart = await Cart.findOne({ customerId });
        if (!cart) cart = new Cart({ customerId, items: [] });

        const itemIndex = cart.items.findIndex(p => p.productId && p.productId.toString() === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += parseInt(quantity);
        } else {
            cart.items.push({ productId, tenantId, price: Number(price), quantity: parseInt(quantity) });
        }
        await cart.save();
        res.json({ success: true, message: "Đã thêm sản phẩm vào giỏ!" });
    } catch (error) { 
        res.status(500).json({ success: false, message: "Lỗi thêm giỏ hàng" }); 
    }
});

// ==========================================
// 4. ĐẶT HÀNG & THANH TOÁN
// ==========================================
router.post('/cart/checkout', isCustomerAuthenticated, async (req, res) => {
    try {
        const customerId = req.session.customer.id || req.session.customer._id;
        const cart = await Cart.findOne({ customerId });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Giỏ hàng trống!" });
        }

        const orderData = {
            items: cart.items.map(item => ({
                product: item.productId, 
                quantity: item.quantity,
                price: item.price
            }))
        };

        const shopId = cart.items[0].tenantId;
        const newOrder = await orderService.createOrder(shopId, customerId, orderData);

        await Cart.deleteOne({ customerId }); 

        res.json({ 
            success: true, 
            message: "Đặt hàng thành công!", 
            orderId: newOrder._id 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ==========================================
// 5. ĐƠN HÀNG & KHIẾU NẠI (DISPUTES)
// ==========================================
router.get('/orders', isCustomerAuthenticated, async (req, res) => {
    try {
        const cId = req.session.customer.id || req.session.customer._id;
        // Fix lỗi "Khách vãng lai" bằng cách tìm đúng customerId
        const orders = await Order.find({ 
            $or: [{ customerId: cId }, { userId: cId }] 
        }).sort({ createdAt: -1 }).lean();

        res.render('customer/orders', { 
            layout: false, 
            orders, 
            customer: req.session.customer 
        });
    } catch (error) { 
        res.status(500).send("Lỗi tải lịch sử đơn hàng."); 
    }
});

router.post('/orders/:id/dispute', isCustomerAuthenticated, async (req, res) => {
    try {
        const orderId = req.params.id;
        const { reason, description, images, type = 'return_refund' } = req.body;

        if (!reason) {
            return res.status(400).json({ success: false, message: "Lý do khiếu nại là bắt buộc!" });
        }

        const updatedOrder = await orderService.handleDispute(orderId, {
            isDisputed: true,
            type,
            reason,
            description,
            images: Array.isArray(images) ? images : (images ? [images] : []),
            status: 'pending'
        });

        const io = req.app.get('socketio');
        if (io) {
            io.emit('orderUpdate', { 
                orderId: updatedOrder._id, 
                status: updatedOrder.status,
                tenantId: updatedOrder.tenantId,
                message: "Có khiếu nại mới từ khách hàng!"
            });
            io.emit('statsUpdate', { tenantId: updatedOrder.tenantId });
        }

        return res.status(200).json({ 
            success: true, 
            message: "Khiếu nại của bạn đã được gửi thành công!", 
            status: updatedOrder.status
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

// Quản lý người mua (Admin)
router.post('/admin/customers', isAuthenticated, customerController.createCustomer);
router.put('/admin/customers/:id', isAuthenticated, customerController.updateCustomer);
router.delete('/admin/customers/:id', isAuthenticated, customerController.deleteCustomer);