import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '@/types/auth';
export interface AuthRequest extends Request {
    user?: JWTPayload;
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=authMiddleware.d.ts.map