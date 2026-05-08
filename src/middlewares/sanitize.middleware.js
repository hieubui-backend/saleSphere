const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

exports.applySanitizers = (app) => {
    // Chống NoSQL Injection
    app.use(mongoSanitize());

    // Chống XSS (Loại bỏ các script độc hại trong input)
    app.use(xss());

    // Chống HTTP Parameter Pollution
    app.use(hpp({
        whitelist: ['price', 'category', 'status', 'page', 'limit'] // Cho phép query cùng lúc nhiều parameter này
    }));
};
