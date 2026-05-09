import { Express } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
const xss = require('xss-clean');
import hpp from 'hpp';

export const applySanitizers = (app: Express) => {
    // Chống NoSQL Injection
    app.use(mongoSanitize());

    // Chống XSS
    app.use(xss());

    // Chống HTTP Parameter Pollution
    app.use(hpp({
        whitelist: ['price', 'category', 'status', 'page', 'limit']
    }));
};





