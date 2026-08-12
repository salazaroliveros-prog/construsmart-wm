/**
 * Rate Limiting Utilities
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * In-memory rate limiting for authentication endpoints
 * For production, consider using Redis-based solutions like Upstash
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (reset on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  // Login attempts: 5 attempts per 10 minutes per IP
  login: {
    maxRequests: 5,
    windowMs: 10 * 60 * 1000, // 10 minutes
  },
  // Session creation: 10 requests per minute per IP
  session: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  // General API: 100 requests per minute per IP
  general: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

/**
 * Check if a request should be rate limited
 * 
 * @param identifier - Unique identifier (IP address, email, etc.)
 * @param config - Rate limit configuration
 * @returns Object with success status and rate limit info
 */
export function checkRateLimit(
  identifier: string,
  config: typeof RATE_LIMIT_CONFIG[keyof typeof RATE_LIMIT_CONFIG]
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  const maxRequests = config.maxRequests;
  
  // If no entry exists or window has expired, create new entry
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(identifier, newEntry);
    
    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }
  
  // Increment count
  entry.count++;
  
  // Check if limit exceeded
  if (entry.count > maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }
  
  // Update entry
  rateLimitStore.set(identifier, entry);
  
  return {
    success: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client IP address from request
 * 
 * @param request - Next.js request object
 * @returns IP address or fallback
 */
export function getClientIP(request: Request): string {
  // Try various headers for IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to a generic identifier
  return 'unknown';
}

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or admin actions
 * 
 * @param identifier - Identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get current rate limit status for an identifier
 * 
 * @param identifier - Identifier to check
 * @returns Current rate limit info or null if not found
 */
export function getRateLimitStatus(identifier: string): {
  count: number;
  resetTime: number;
} | null {
  const entry = rateLimitStore.get(identifier);
  if (!entry) {
    return null;
  }
  
  // Clean up expired entry
  if (Date.now() > entry.resetTime) {
    rateLimitStore.delete(identifier);
    return null;
  }
  
  return {
    count: entry.count,
    resetTime: entry.resetTime,
  };
}