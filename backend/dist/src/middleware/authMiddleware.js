"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_1 = require("@/config/jwt");
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.get('Authorization');
        const token = jwt_1.jwtService.extractTokenFromHeader(authHeader);
        if (!token) {
            res.status(401).json({
                error: 'Access token required',
                code: 'NO_TOKEN'
            });
            return;
        }
        // Verify the token
        const decoded = jwt_1.jwtService.verifyAccessToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        if (error instanceof Error && error.message.includes('Invalid or expired')) {
            res.status(401).json({
                error: 'Invalid or expired token',
                code: 'INVALID_TOKEN'
            });
            return;
        }
        res.status(500).json({
            error: 'Authentication error',
            code: 'AUTH_ERROR'
        });
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=authMiddleware.js.map