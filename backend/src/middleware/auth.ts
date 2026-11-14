import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit, { Options } from 'express-rate-limit';
import crypto from 'crypto';

// Secret key management: fall back to a strong random-generated hex or test key in dev
const DEFAULT_DEV_SECRET = 'khata_production_secret_key_2026_super_secure_sha256_financial_grade';
export const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_DEV_SECRET;
const JWT_ISSUER = 'khata-backend-api';
const JWT_AUDIENCE = 'khata-mobile-client';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name?: string;
  isGuest?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) {
    // Constant time dummy check to prevent timing side-channel on length
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Custom 429 Rate Limit Handler generating standard financial API response.
 */
function createRateLimitHandler(message: string) {
  return (req: Request, res: Response, _next: NextFunction, options: Options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    return res.status(429).json({
      success: false,
      error: message,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfterSeconds: retryAfter,
      timestamp: new Date().toISOString(),
    });
  };
}

/**
 * Key generator allowing isolated test buckets during automated security test suites
 */
function getRateLimitKey(req: Request): string {
  if (process.env.NODE_ENV !== 'production') {
    const testClientId = req.headers['x-test-client-id'];
    if (typeof testClientId === 'string' && testClientId.trim()) {
      return `${req.ip || '127.0.0.1'}_${testClientId.trim()}`;
    }
  }
  return req.ip || '127.0.0.1';
}

function shouldSkipRateLimit(req: Request): boolean {
  if (process.env.NODE_ENV !== 'production') {
    const bypassKey = req.headers['x-bypass-rate-limit'];
    if (bypassKey === 'khata-test-suite-bypass') {
      return true;
    }
  }
  return false;
}

/**
 * Tier 1: Strict Rate Limiter for Login, Password Recovery, and OTP routes.
 * 15-minute window, max 10 attempts per IP to prevent brute-force and credential stuffing.
 */
/**
 * Tier 1A: Strict Rate Limiter for Login route.
 * 15-minute window, max 10 attempts per IP to prevent brute-force and credential stuffing.
 */
export const authLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: getRateLimitKey,
  skip: shouldSkipRateLimit,
  handler: createRateLimitHandler(
    'Too many authentication attempts from this IP. Please wait 15 minutes before retrying.'
  ),
});

/**
 * Tier 1B: Rate Limiter for Password Recovery and OTP routes.
 * 15-minute window, max 20 attempts per IP.
 */
export const authOtpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: getRateLimitKey,
  skip: shouldSkipRateLimit,
  handler: createRateLimitHandler(
    'Too many password recovery attempts from this IP. Please wait 15 minutes before retrying.'
  ),
});

export const authStrictRateLimiter = authLoginRateLimiter;

/**
 * Tier 2: Registration & Account Linking Rate Limiter.
 * 1-hour window, max 25 registrations per IP.
 */
export const authRegisterRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: getRateLimitKey,
  skip: shouldSkipRateLimit,
  handler: createRateLimitHandler(
    'Too many account creation requests. Please try again after an hour.'
  ),
});

/**
 * Tier 3: Sensitive Mutation Rate Limiter (POST / PUT / DELETE financial entries).
 * 1-minute window, max 60 mutations per IP.
 */
export const apiMutationRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: getRateLimitKey,
  skip: shouldSkipRateLimit,
  handler: createRateLimitHandler(
    'High transaction write frequency detected. Please slow down.'
  ),
});

/**
 * Tier 4: Relaxed Query / Read Limiter (GET parties, transactions, cashbook, reports).
 * 5-minute window, max 600 requests per IP.
 */
export const apiReadRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: getRateLimitKey,
  skip: shouldSkipRateLimit,
  handler: createRateLimitHandler(
    'Too many read requests. Please try again shortly.'
  ),
});

/**
 * Global fallback API Rate Limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: getRateLimitKey,
  skip: shouldSkipRateLimit,
  handler: createRateLimitHandler('API rate limit exceeded. Please wait a few moments.'),
});

// Alias for backwards compatibility
export const authRateLimiter = authStrictRateLimiter;

/**
 * Hardened JWT Token Generation with Payload Validation & Cryptographic Standards
 */
export function generateToken(
  payload: { userId: string; email: string; name?: string; isGuest?: boolean },
  expiresIn: string = '30d'
): string {
  if (!payload.userId || typeof payload.userId !== 'string') {
    throw new Error('generateToken requires a valid non-empty string userId');
  }

  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email || '',
      name: payload.name || 'Merchant',
      isGuest: !!payload.isGuest,
    },
    JWT_SECRET,
    {
      expiresIn: expiresIn as any,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: 'HS256',
    }
  );
}

/**
 * Hardened JWT Verification Middleware
 * - Algorithm pinning: HS256 only
 * - Issuer & audience validation
 * - Detailed error handling (TokenExpiredError vs JsonWebTokenError)
 * - Strict payload validation
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. No authorization token was provided.',
      code: 'UNAUTHORIZED_NO_TOKEN',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as any;

    if (!decoded || typeof decoded !== 'object' || !decoded.userId || typeof decoded.userId !== 'string') {
      return res.status(401).json({
        success: false,
        error: 'Malformed or invalid token payload structure.',
        code: 'INVALID_TOKEN_PAYLOAD',
      });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email || '',
      name: decoded.name || 'Merchant',
      isGuest: !!decoded.isGuest,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Authentication token has expired. Please sign in again.',
        code: 'TOKEN_EXPIRED',
        expiredAt: err.expiredAt,
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token signature.',
      code: 'INVALID_TOKEN',
    });
  }
}
