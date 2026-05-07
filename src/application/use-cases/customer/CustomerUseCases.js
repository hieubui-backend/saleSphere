class CustomerUseCases {
    constructor({ customerRepository, cartModel }) {
        this.customerRepository = customerRepository;
        this.Cart = cartModel;
    }

    async createCustomer({ name, email, phone, address }) {
        const existing = await this.customerRepository.findByEmail(email);
        if (existing) throw new Error('Email đã tồn tại!');
        return await this.customerRepository.create({ name, email, phone, address });
    }

    async updateCustomer(id, { name, email, phone, address }) {
        const customer = await this.customerRepository.updateById(id, { name, email, phone, address });
        if (!customer) throw new Error('Không tìm thấy người mua!');
        return customer;
    }

    async deleteCustomer(id) {
        const customer = await this.customerRepository.deleteById(id);
        if (!customer) throw new Error('Không tìm thấy người mua!');
        return customer;
    }

    async getAllCustomers(filter = {}) {
        return await this.customerRepository.findAll(filter);
    }

    async addToCart(customerId, { productId, tenantId, price }) {
        let cart = await this.Cart.findOne({ customerId });

        if (!cart) {
            cart = new this.Cart({ customerId, items: [] });
        }

        const itemIndex = cart.items.findIndex(p => p.productId.toString() === productId);
        
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += 1;
        } else {
            cart.items.push({ productId, tenantId, price, quantity: 1 });
        }

        await cart.save();
        return cart;
    }
}

module.exports = CustomerUseCases;
