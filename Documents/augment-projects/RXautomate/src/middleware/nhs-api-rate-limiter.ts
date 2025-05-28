import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Constants
const RATE_LIMITS = {
  'pds': 600, // 600 requests per minute
  'eps': 300, // 300 requests per minute
  'pecs': 300, // 300 requests per minute
  'default': 300, // Default: 300 requests per minute
};
const WINDOW_SIZE = 60; // Window size in seconds

// Utility Functions
/**
 * Generate Redis key for rate limiting
 */
function generateRateLimitKey(apiName: string, ip: string): string {
  return `nhs:ratelimit:${apiName}:${ip}`;
}

/**
 * Set rate limit headers on the response
 */
function setRateLimitHeaders(headers: Headers, limit: number, remaining: number, reset: number): void {
  headers.set('X-RateLimit-Limit', limit.toString());
  headers.set('X-RateLimit-Remaining', Math.max(0, remaining).toString());
  headers.set('X-RateLimit-Reset', reset.toString());
}

/**
 * Log rate limit events for monitoring
 */
async function logRateLimitEvent(apiName: string, ip: string, requestCount: number): Promise<void> {
  try {
    const eventKey = `nhs:ratelimit:events`;
    const event = {
      apiName,
      ip,
      requestCount,
      timestamp: Date.now(),
    };

    await redis.lpush(eventKey, JSON.stringify(event));
    await redis.ltrim(eventKey, 0, 999);
    await redis.expire(eventKey, 60 * 60 * 24 * 7); // Expire after 7 days
  } catch (error) {
    console.error('Error logging rate limit event:', error);
  }
}

// Middleware
/**
 * Rate limiting middleware for NHS API calls
 */
export async function nhsApiRateLimiter(request: NextRequest, apiName: string = 'default') {
  // Skip rate limiting in development mode
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_RATE_LIMIT === 'true') {
    return NextResponse.next();
  }

  try {
    const ip = request.ip || 'unknown';
    const limit = RATE_LIMITS[apiName] || RATE_LIMITS.default;
    const now = Date.now();
    const windowStart = now - WINDOW_SIZE * 1000;
    const key = generateRateLimitKey(apiName, ip);

    // Add the current timestamp to the sorted set
    await redis.zadd(key, { score: now, member: now.toString() });
    // Remove timestamps outside the current window
    await redis.zremrangebyscore(key, 0, windowStart);
    // Set expiry on the key (2x window size to be safe)
    await redis.expire(key, WINDOW_SIZE * 2);

    // Count the number of requests in the current window
    const requestCount = await redis.zcard(key);
    const headers = new Headers();
    setRateLimitHeaders(headers, limit, limit - requestCount, Math.ceil(now / 1000 + WINDOW_SIZE));

    // If the request count exceeds the limit, return 429 Too Many Requests
    if (requestCount > limit) {
      console.warn(`Rate limit exceeded for NHS API ${apiName} from IP ${ip}`);
      // Log rate limit event
      await logRateLimitEvent(apiName, ip, requestCount);

      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: `Rate limit of ${limit} requests per minute exceeded for NHS API ${apiName}`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': WINDOW_SIZE.toString(),
            ...Object.fromEntries(headers),
          },
        }
      );
    }

    // Continue with the request
    const response = NextResponse.next();
    setRateLimitHeaders(response.headers, limit, limit - requestCount, Math.ceil(now / 1000 + WINDOW_SIZE));
    return response;
  } catch (error) {
    console.error('Error in NHS API rate limiter:', error);
    // If rate limiting fails, allow the request to proceed
    // This prevents the rate limiter from blocking legitimate requests
    return NextResponse.next();
  }
}
