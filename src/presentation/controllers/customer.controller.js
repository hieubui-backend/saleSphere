exports.createCustomer = async (req, res) => {
    try {
        const { customerUseCases } = req.container.cradle;
        const customer = await customerUseCases.createCustomer(req.body);
        res.status(201).json({ success: true, customer });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const { customerUseCases } = req.container.cradle;
        const customer = await customerUseCases.updateCustomer(req.params.id, req.body);
        res.json({ success: true, customer });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const { customerUseCases } = req.container.cradle;
        await customerUseCases.deleteCustomer(req.params.id);
        res.json({ success: true, message: 'Đã xóa người mua.' });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { customerUseCases } = req.container.cradle;
        const customerId = req.session.customer._id;
        
        await customerUseCases.addToCart(customerId, req.body);
        res.json({ success: true, message: "Đã thêm vào giỏ hàng!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
