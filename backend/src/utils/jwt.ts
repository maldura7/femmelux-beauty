import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';

/**
 * Token payload interface
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'VENDOR' | 'CUSTOMER';
  brandId?: string;
}

/**
 * Decoded token with JWT metadata
 */
export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

/**
 * Token pair (access + refresh)
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Token verification result
 */
export interface TokenVerificationResult {
  valid: boolean;
  expired: boolean;
  payload: TokenPayload | null;
}

/**
 * Parse expiration time string to seconds
 *
 * @param expiration - Expiration string (e.g., "15m", "7d", "1h")
 * @returns Expiration time in seconds
 */
function parseExpirationTime(expiration: string): number {
  const match = expiration.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // Default 15 minutes

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    default: return 900;
  }
}

/**
 * Generate access and refresh tokens for a user
 *
 * @param payload - User data to encode in the token
 * @returns Object containing access token, refresh token, and expiration time
 */
export function generateTokens(payload: TokenPayload): TokenPair {
  // Convert string expiration to seconds for type safety
  const accessExpiresInSeconds = parseExpirationTime(config.jwtExpiresIn);
  const refreshExpiresInSeconds = parseExpirationTime(config.jwtRefreshExpiresIn);

  const accessTokenOptions: SignOptions = {
    expiresIn: accessExpiresInSeconds,
    issuer: 'femmelux-beauty',
    subject: payload.userId,
  };

  const refreshTokenOptions: SignOptions = {
    expiresIn: refreshExpiresInSeconds,
    issuer: 'femmelux-beauty',
    subject: payload.userId,
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, accessTokenOptions);
  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, refreshTokenOptions);

  return { accessToken, refreshToken, expiresIn: accessExpiresInSeconds };
}

/**
 * Generate only an access token
 *
 * @param payload - User data to encode in the token
 * @returns Access token string
 */
export function generateAccessToken(payload: TokenPayload): string {
  const expiresInSeconds = parseExpirationTime(config.jwtExpiresIn);
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: expiresInSeconds,
    issuer: 'femmelux-beauty',
    subject: payload.userId,
  });
}

/**
 * Verify access token
 *
 * @param token - JWT access token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyAccessToken(token: string): DecodedToken {
  return jwt.verify(token, config.jwtSecret, {
    issuer: 'femmelux-beauty',
  }) as DecodedToken;
}

/**
 * Verify refresh token
 *
 * @param token - JWT refresh token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyRefreshToken(token: string): DecodedToken {
  return jwt.verify(token, config.jwtRefreshSecret, {
    issuer: 'femmelux-beauty',
  }) as DecodedToken;
}

/**
 * Safely verify a token without throwing
 *
 * @param token - JWT token to verify
 * @param isRefreshToken - Whether this is a refresh token
 * @returns Verification result with validity, expiration status, and payload
 */
export function safeVerifyToken(
  token: string,
  isRefreshToken: boolean = false
): TokenVerificationResult {
  try {
    const secret = isRefreshToken ? config.jwtRefreshSecret : config.jwtSecret;
    const payload = jwt.verify(token, secret, {
      issuer: 'femmelux-beauty',
    }) as DecodedToken;

    return {
      valid: true,
      expired: false,
      payload: {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        brandId: payload.brandId,
      },
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, expired: true, payload: null };
    }
    return { valid: false, expired: false, payload: null };
  }
}

/**
 * Decode token without verification (for inspection only)
 *
 * @param token - JWT token to decode
 * @returns Decoded payload or null if invalid format
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded.payload === 'string') {
      return null;
    }
    return decoded.payload as DecodedToken;
  } catch {
    return null;
  }
}

/**
 * Check if a token is expired
 *
 * @param token - JWT token to check
 * @returns True if the token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  return Date.now() >= decoded.exp * 1000;
}

/**
 * Get token expiration date
 *
 * @param token - JWT token
 * @returns Expiration date or null if invalid
 */
export function getTokenExpiration(token: string): Date | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;
  return new Date(decoded.exp * 1000);
}

/**
 * Extract token from Authorization header
 *
 * @param authHeader - Authorization header value (e.g., "Bearer <token>")
 * @returns Token string or null if not found
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export default {
  generateTokens,
  generateAccessToken,
  verifyAccessToken,
  verifyRefreshToken,
  safeVerifyToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  extractTokenFromHeader,
};
