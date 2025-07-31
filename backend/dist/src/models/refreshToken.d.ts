interface RefreshToken {
    id: number;
    user_id: number;
    token: string;
    expires_at: Date;
    created_at: Date;
    used_at?: Date;
    is_revoked: boolean;
    username?: string;
    email?: string;
}
interface CreateRefreshTokenData {
    user_id: number;
    token: string;
    expires_at: Date;
}
declare class RefreshTokenModel {
    static store(userId: number, token: string, expiresAt: Date): Promise<RefreshToken>;
    static findByToken(token: string): Promise<RefreshToken | null>;
    static markAsUsed(token: string): Promise<void>;
    static revoke(token: string): Promise<void>;
    static cleanupExpired(): Promise<void>;
    static revokeAllForUser(userId: number): Promise<void>;
    static getActiveTokensCount(userId: number): Promise<number>;
}
export default RefreshTokenModel;
export { RefreshToken, CreateRefreshTokenData };
//# sourceMappingURL=refreshToken.d.ts.map