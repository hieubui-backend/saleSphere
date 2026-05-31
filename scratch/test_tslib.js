try {
    const tslib = require('tslib');
    console.log('✅ tslib loaded successfully');
    console.log('Version:', tslib.__version || 'unknown');
} catch (e) {
    console.error('❌ Failed to load tslib:', e.message);
}
