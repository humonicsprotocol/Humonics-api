import Fastify from 'fastify';
import { registerAuth } from '../src/middleware/auth';
import { mockRedis } from './mocks';

function buildApp(redisOverrides = {}) {
  const app = Fastify({ logger: false });
  (app as any).redis = mockRedis(redisOverrides);
  registerAuth(app);
  app.get('/v1/test', async () => ({ ok: true }));
  return app;
}

describe('auth middleware', () => {
  it('allows requests to /health without a key', async () => {
    const app = buildApp({ sismember: jest.fn().mockResolvedValue(0) });
    const res = await app.inject({ method: 'GET', url: '/health' });
    // health route not registered — 404 is fine, not 401
    expect(res.statusCode).not.toBe(401);
  });

  it('returns 401 when Authorization header is missing', async () => {
    const app = buildApp({ sismember: jest.fn().mockResolvedValue(0) });
    const res = await app.inject({ method: 'GET', url: '/v1/test' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for an invalid API key', async () => {
    const app = buildApp({ sismember: jest.fn().mockResolvedValue(0) });
    const res = await app.inject({
      method: 'GET',
      url: '/v1/test',
      headers: { authorization: 'Bearer invalid_key' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('allows a valid free-tier key', async () => {
    // sismember returns 1 for paid check = 0, free check = 1
    const sismember = jest.fn()
      .mockResolvedValueOnce(0)  // paid check
      .mockResolvedValueOnce(1); // free check
    const app = buildApp({ sismember });
    const res = await app.inject({
      method: 'GET',
      url: '/v1/test',
      headers: { authorization: 'Bearer valid_free_key' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('allows a valid paid-tier key', async () => {
    const sismember = jest.fn().mockResolvedValueOnce(1); // paid check passes
    const app = buildApp({ sismember });
    const res = await app.inject({
      method: 'GET',
      url: '/v1/test',
      headers: { authorization: 'Bearer valid_paid_key' },
    });
    expect(res.statusCode).toBe(200);
  });
});
