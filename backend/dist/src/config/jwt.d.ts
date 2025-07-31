import { JWTPayload, TokenPair } from '@/types/auth';
declare class JWTService {
    private readonly accessTokenSecret;
    private readonly refreshTokenSecret;
    private readonly accessTokenExpiry;
    private readonly refreshTokenExpiry;
    constructor();
    /**
     * Generate both access and refresh tokens
     */
    generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp'>): TokenPair;
    /**
     * Generate access token only
     */
    generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string;
    /**
     * Generate refresh token only
     */
    generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string;
    /**
     * Verify access token
     */
    verifyAccessToken(token: string): JWTPayload;
    /**
     * Verify refresh token
     */
    verifyRefreshToken(token: string): JWTPayload;
    /**
     * Extract token from Authorization header
     */
    extractTokenFromHeader(authHeader: string | undefined): string | null;
    /**
     * Decode token without verification (for debugging)
     */
    decodeToken(token: string): JWTPayload | null;
}
export declare const jwtService: JWTService;
export default jwtService;
//# sourceMappingURL=jwt.d.ts.map