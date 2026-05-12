import type { FastifyInstance } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';

export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(fastifyRateLimit, {
    // Dynamic limit based on API key tier set by auth middleware
    max: (request) => (request.apiKeyTier === 'paid' ? 1000 : 100),
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      const auth = request.headers['authorization'];
      return auth ? auth.slice(7, 20) : request.ip; // Use key prefix as bucket, not full key
    },
    errorResponseBuilder: () => ({ error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }),
  });
}
