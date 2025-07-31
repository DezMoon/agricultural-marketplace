import { CorsOptions } from 'cors';
export declare const securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
export declare const generalLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const uploadLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const messageLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const listingLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const corsOptions: CorsOptions;
//# sourceMappingURL=security.d.ts.map