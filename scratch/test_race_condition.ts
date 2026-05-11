import mongoose from 'mongoose';
import ProductModel from '../src/infrastructure/database/models/product.model';
import ProductRepository from '../src/infrastructure/repositories/ProductRepository';

import config from '../src/config/config';

async function testRaceCondition() {
    await mongoose.connect(config.mongoUri);
    
    const productRepo = new ProductRepository({ productModel: ProductModel });
    
    // Tạo sản phẩm mẫu có tồn kho = 1
    const product = await ProductModel.create({
        name: 'Sản phẩm giới hạn',
        price: 100000,
        stock: 1,
        category: 'Công nghệ',
        images: []
    });

    console.log(`Sản phẩm ban đầu: ${product.name}, Tồn kho: ${product.stock}`);

    // Giả lập 2 người mua cùng lúc
    console.log('--- Bắt đầu mua hàng đồng thời ---');
    
    const results = await Promise.all([
        productRepo.decrementStock(product._id.toString(), 1),
        productRepo.decrementStock(product._id.toString(), 1)
    ]);

    console.log(`Kết quả Người 1: ${results[0] ? 'Thành công' : 'Thất bại (Hết hàng)'}`);
    console.log(`Kết quả Người 2: ${results[1] ? 'Thành công' : 'Thất bại (Hết hàng)'}`);

    const updatedProduct = await ProductModel.findById(product._id);
    console.log(`Tồn kho cuối cùng: ${updatedProduct?.stock}`);

    // Dọn dẹp
    await ProductModel.findByIdAndDelete(product._id);
    await mongoose.disconnect();
}

testRaceCondition();
