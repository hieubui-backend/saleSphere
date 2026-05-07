const Cart = require('../modules/Cart');
const Customer = require('../modules/customer/customer.model');

exports.createCustomer = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        const existing = await Customer.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: 'Email đã tồn tại!' });
        const customer = new Customer({ name, email, phone, address });
        await customer.save();
        res.status(201).json({ success: true, customer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address } = req.body;
        const customer = await Customer.findByIdAndUpdate(id, { name, email, phone, address }, { new: true });
        if (!customer) return res.status(404).json({ success: false, message: 'Không tìm thấy người mua!' });
        res.json({ success: true, customer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findByIdAndDelete(id);
        if (!customer) return res.status(404).json({ success: false, message: 'Không tìm thấy người mua!' });
        res.json({ success: true, message: 'Đã xóa người mua.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { productId, tenantId, price } = req.body;
        const customerId = req.session.customer._id;

        let cart = await Cart.findOne({ customerId });

        if (!cart) {
            cart = new Cart({ customerId, items: [] });
        }

        const itemIndex = cart.items.findIndex(p => p.productId.toString() === productId);
        
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += 1;
        } else {
            cart.items.push({ productId, tenantId, price, quantity: 1 });
        }

        await cart.save();
        res.json({ success: true, message: "Đã thêm vào giỏ hàng!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};