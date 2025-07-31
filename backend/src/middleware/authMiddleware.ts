// src/middleware/authMiddleware.ts - Authentication middleware with TypeScript
import { Request, Response, NextFunction } from 'express';
import { jwtService } from '@/config/jwt';
import { JWTPayload } from '@/types/auth';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.get('Authorization');
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({ 
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
      return;
    }

    // Verify the token
    const decoded = jwtService.verifyAccessToken(token);
    req.user = decoded;
    next();

  } catch (error) {
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
