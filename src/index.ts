import Fastify from 'fastify';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { HumonicsClient } from '@humonics/sdk';
import './types/fastify';
import { registerAuth } from './middleware/auth';
import { registerRateLimit } from './middleware/rate-limit';
import { registerErrorHandler } from './middleware/error';
import { registerVerifyRoute } from './routes/verify';
import { registerCertificatesRoute } from './routes/certificates';
import { registerHealthRoute } from './routes/health';

async function main() {
  if (!process.env['REDIS_URL']) throw new Error('REDIS_URL is required');

  const network = (process.env['NETWORK'] ?? 'testnet') as 'mainnet' | 'testnet';

  const app = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
      serializers: {
        req: (req) => ({ method: req.method, url: req.url, id: req.id }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    },
    genReqId: () => randomUUID(),
  });

  app.redis = new Redis(process.env['REDIS_URL']);
  app.sdk = new HumonicsClient({ network });

  registerAuth(app);
  await registerRateLimit(app);
  registerErrorHandler(app);

  registerHealthRoute(app, network);
  registerVerifyRoute(app);
  registerCertificatesRoute(app);

  const port = parseInt(process.env['PORT'] ?? '3000', 10);
  await app.listen({ port, host: '0.0.0.0' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
