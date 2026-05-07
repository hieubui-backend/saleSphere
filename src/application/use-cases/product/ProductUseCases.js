class ProductUseCases {
    constructor({ productRepository }) {
        this.productRepository = productRepository;
    }

    async getAllProducts(tenantId, query = {}) {
        return await this.productRepository.findByTenant(tenantId, query);
    }

    async getProductById(id, tenantId) {
        return await this.productRepository.findByIdAndTenant(id, tenantId);
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

    async updateProduct(id, tenantId, updateData) {
        const formattedUpdate = { ...updateData };
        
        if (formattedUpdate.price !== undefined) formattedUpdate.price = Number(formattedUpdate.price) || 0;
        if (formattedUpdate.stock !== undefined) formattedUpdate.stock = Number(formattedUpdate.stock) || 0;
        if (formattedUpdate.name) formattedUpdate.name = formattedUpdate.name.trim();

        return await this.productRepository.updateByIdAndTenant(id, tenantId, formattedUpdate);
    }

    async deleteProduct(id, tenantId) {
        return await this.productRepository.deleteByIdAndTenant(id, tenantId);
    }
}

module.exports = ProductUseCases;
