import { createHash } from 'crypto';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

const FREE_RATE_LIMIT = 100;
const PAID_RATE_LIMIT = 1000;

const FREE_KEYS_SET = 'humonics:keys:free';
const PAID_KEYS_SET = 'humonics:keys:paid';

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function registerAuth(app: FastifyInstance): void {
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip auth for health endpoint
    if (request.url === '/health') return;

    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Missing API key' });
    }

    const rawKey = authHeader.slice(7);
    const hashed = hashKey(rawKey);

    // Check paid tier first (higher limit)
    const isPaid = await app.redis.sismember(PAID_KEYS_SET, hashed);
    if (isPaid) {
      request.apiKeyTier = 'paid';
      return;
    }

    const isFree = await app.redis.sismember(FREE_KEYS_SET, hashed);
    if (isFree) {
      request.apiKeyTier = 'free';
      return;
    }

    return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Invalid API key' });
  });
}

export function getRateLimit(request: FastifyRequest): number {
  return request.apiKeyTier === 'paid' ? PAID_RATE_LIMIT : FREE_RATE_LIMIT;
}
