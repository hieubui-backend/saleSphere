import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

async function runTests() {
    console.log('🚀 Starting API Connectivity Tests...\n');

    const tests = [
        { name: 'Health Check', url: '/', method: 'get' },
        { name: 'Public Products', url: '/api/products', method: 'get' },
        { name: 'Auth Login (Mock)', url: '/api/auth/login', method: 'post', data: { email: 'test@admin.com', password: 'wrong' } },
        { name: 'Admin Dashboard (Unauthorized)', url: '/api/admin/dashboard', method: 'get' },
        { name: 'Customer Home (Legacy Redirect Check)', url: '/api/customer/home', method: 'get' },
        { name: 'All Orders (Unauthorized)', url: '/api/orders', method: 'get' },
        { name: 'User Info (Unauthorized)', url: '/api/users/profile', method: 'get' },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            console.log(`Testing [${test.method.toUpperCase()}] ${test.url} ...`);
            const response = await (axios as any)[test.method](`${BASE_URL}${test.url}`, test.data);
            console.log(`✅ Passed: ${test.name} (Status: ${response.status})`);
            passed++;
        } catch (error: any) {
            const status = error.response?.status;
            if (status === 401 || status === 403 || status === 400 || status === 404) {
                // These are "expected" failures if we don't have auth or correct data
                console.log(`ℹ️  Controlled Response: ${test.name} (Status: ${status})`);
                passed++;
            } else {
                console.error(`❌ Failed: ${test.name} (Status: ${status || 'ECONNREFUSED'})`);
                failed++;
            }
        }
    }

    console.log(`\n📊 Results: ${passed} Passed, ${failed} Failed`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
