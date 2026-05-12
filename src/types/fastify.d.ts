import 'fastify';
import type { Redis } from 'ioredis';
import type { HumonicsClient } from '@humonics/sdk';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
    sdk: HumonicsClient;
  }
  interface FastifyRequest {
    apiKeyTier?: 'free' | 'paid';
  }
}
