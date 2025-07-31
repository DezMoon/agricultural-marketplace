import { JWTPayload } from './auth';
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}
export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T> extends APIResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface ValidationError {
    field: string;
    message: string;
}
export interface ErrorResponse {
    error: string;
    details?: ValidationError[];
    code?: string;
}
//# sourceMappingURL=express.d.ts.map