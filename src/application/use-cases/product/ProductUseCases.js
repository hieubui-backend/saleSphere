class ProductUseCases {
    constructor({ productRepository }) {
        this.productRepository = productRepository;
    }

    async getAllProducts(query = {}) {
        return await this.productRepository.findAll(query);
    }

    async getProductById(id) {
        return await this.productRepository.findById(id);
    }

    async createProduct(productData) {
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

        return await this.productRepository.create(cleanData);
    }

    async updateProduct(id, updateData) {
        const formattedUpdate = { ...updateData };
        
        if (formattedUpdate.price !== undefined) formattedUpdate.price = Number(formattedUpdate.price) || 0;
        if (formattedUpdate.stock !== undefined) formattedUpdate.stock = Number(formattedUpdate.stock) || 0;
        if (formattedUpdate.name) formattedUpdate.name = formattedUpdate.name.trim();

        return await this.productRepository.updateById(id, formattedUpdate);
    }

    async deleteProduct(id) {
        return await this.productRepository.deleteById(id);
    }
}

module.exports = ProductUseCases;
