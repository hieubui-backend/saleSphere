import { ICradle } from '../di/cradle';

declare global {
    namespace Express {
        interface Request {
            container: {
                cradle: ICradle;
            };
            user?: any;
            files?: any[];
            xhr: boolean;
        }
    }
}

import 'express-session';
declare module 'express-session' {
    interface SessionData {
        user: any;
        customer: any;
    }
}






