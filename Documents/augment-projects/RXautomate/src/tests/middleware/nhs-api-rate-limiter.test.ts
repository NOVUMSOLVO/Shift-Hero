import { NextRequest } from 'next/server';
import { nhsApiRateLimiter } from '@/middleware/nhs-api-rate-limiter';
import { Redis } from '@upstash/redis';

jest.mock('@upstash/redis', () => {
  const mockRedis = {
    zadd: jest.fn(),
    zremrangebyscore: jest.fn(),
    expire: jest.fn(),
    zcard: jest.fn(),
    lpush: jest.fn(),
    ltrim: jest.fn(),
  };
  return { Redis: jest.fn(() => mockRedis) };
});

describe('nhsApiRateLimiter', () => {
  const mockRedis = new Redis();
  const mockRequest = new NextRequest('http://localhost/api/test', {
    headers: new Headers(),
    method: 'GET',
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows requests under the rate limit', async () => {
    mockRedis.zcard.mockResolvedValueOnce(2);

    const response = await nhsApiRateLimiter(mockRequest, 'pds');

    expect(response.status).toBe(200);
    expect(mockRedis.zadd).toHaveBeenCalled();
    expect(mockRedis.zremrangebyscore).toHaveBeenCalled();
    expect(mockRedis.expire).toHaveBeenCalled();
  });

  it('blocks requests exceeding the rate limit', async () => {
    mockRedis.zcard.mockResolvedValueOnce(601);

    const response = await nhsApiRateLimiter(mockRequest, 'pds');

    expect(response.status).toBe(429);
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(mockRedis.lpush).toHaveBeenCalled();
  });

  it('handles Redis errors gracefully', async () => {
    mockRedis.zadd.mockRejectedValueOnce(new Error('Redis error'));

    const response = await nhsApiRateLimiter(mockRequest, 'pds');

    expect(response.status).toBe(200);
    expect(console.error).toHaveBeenCalledWith('Error in NHS API rate limiter:', expect.any(Error));
  });
});