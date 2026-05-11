import mongoose from 'mongoose';
import RedisService from '../src/infrastructure/cache/RedisService';
import ProductUseCases from '../src/application/use-cases/product/ProductUseCases';
import ProductRepository from '../src/infrastructure/repositories/ProductRepository';
import ProductModel from '../src/infrastructure/database/models/product.model';
import config from '../src/config/config';

async function testRedisCaching() {
    // 1. Kết nối DB và Redis
    await mongoose.connect(config.mongoUri);
    const redisService = new RedisService();
    const productRepo = new ProductRepository({ productModel: ProductModel });
    const productUseCases = new ProductUseCases({ productRepository: productRepo, redisService });

    // 2. Tạo sản phẩm test
    const product = await ProductModel.create({
        name: 'Sản phẩm Caching Test',
        price: 50000,
        stock: 10,
        category: 'Test',
        images: []
    });
    const productId = product._id.toString();

    console.log(`\n--- Bắt đầu kiểm thử Caching cho sản phẩm: ${productId} ---`);

    // 3. Lần đầu: Cache Miss (Query DB)
    console.time('Lần 1 (Cache Miss)');
    const p1 = await productUseCases.getProductById(productId);
    console.timeEnd('Lần 1 (Cache Miss)');
    console.log('Dữ liệu lấy được:', p1?.name);

    // 4. Lần hai: Cache Hit (Lấy từ Redis)
    console.time('Lần 2 (Cache Hit)');
    const p2 = await productUseCases.getProductById(productId);
    console.timeEnd('Lần 2 (Cache Hit)');
    console.log('Dữ liệu lấy được:', p2?.name);

    // 5. Kiểm tra tính nhất quán (Cập nhật dữ liệu)
    console.log('\n--- Cập nhật sản phẩm (Xóa cache) ---');
    await productUseCases.updateProduct(productId, { name: 'Sản phẩm Caching Test - Đã cập nhật' });

    // 6. Lần ba: Sau khi cập nhật (Phải là Cache Miss và lấy dữ liệu mới)
    console.time('Lần 3 (Cache Miss sau Update)');
    const p3 = await productUseCases.getProductById(productId);
    console.timeEnd('Lần 3 (Cache Miss sau Update)');
    console.log('Dữ liệu mới:', p3?.name);

    if (p3?.name.includes('Đã cập nhật')) {
        console.log('\n✅ TEST PASSED: Caching và Invalidation hoạt động hoàn hảo!');
    } else {
        console.log('\n❌ TEST FAILED: Dữ liệu cache không đồng nhất.');
    }

    // Dọn dẹp
    await ProductModel.findByIdAndDelete(productId);
    await redisService.del(`product:${productId}`);
    await redisService.clearPattern('products:all:*');
    await mongoose.disconnect();
}

testRedisCaching();
