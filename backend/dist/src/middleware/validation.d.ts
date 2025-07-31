import { Request, Response, NextFunction } from 'express';
import { ValidationChain } from 'express-validator';
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => void;
export declare const userValidation: {
    register: ValidationChain[];
    login: ValidationChain[];
    forgotPassword: ValidationChain[];
    resetPassword: ValidationChain[];
};
export declare const produceValidation: {
    create: ValidationChain[];
    update: ValidationChain[];
};
export declare const messageValidation: {
    send: ValidationChain[];
};
export declare const queryValidation: {
    pagination: ValidationChain[];
    produceSearch: ValidationChain[];
};
//# sourceMappingURL=validation.d.ts.map