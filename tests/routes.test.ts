import Fastify from 'fastify';
import { HumonicsError } from '@humonics/sdk';
import { registerVerifyRoute } from '../src/routes/verify';
import { registerCertificatesRoute } from '../src/routes/certificates';
import { registerHealthRoute } from '../src/routes/health';
import { registerErrorHandler } from '../src/middleware/error';
import { mockSdk, mockRedis, MOCK_CERT } from './mocks';

function buildApp(sdkOverrides = {}, redisOverrides = {}) {
  const app = Fastify({ logger: false });
  (app as any).sdk = mockSdk(sdkOverrides);
  (app as any).redis = mockRedis(redisOverrides);
  registerErrorHandler(app);
  registerHealthRoute(app, 'testnet');
  registerVerifyRoute(app);
  registerCertificatesRoute(app);
  return app;
}

const VALID_HASH = 'a'.repeat(64);

describe('GET /health', () => {
  it('returns ok with network', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', network: 'testnet' });
  });
});

describe('GET /v1/verify/:contentHash', () => {
  it('returns certified=true for a known hash', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: `/v1/verify/${VALID_HASH}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().certified).toBe(true);
    expect(res.json().certificate.id).toBe('cert_abc123');
  });

  it('returns certified=false for unknown content', async () => {
    const app = buildApp({
      verify: jest.fn().mockResolvedValue({ certified: false }),
    });
    const res = await app.inject({ method: 'GET', url: `/v1/verify/${VALID_HASH}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().certified).toBe(false);
  });

  it('returns 400 for invalid content hash', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/v1/verify/not-a-hash' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('INVALID_INPUT');
  });

  it('returns 503 on network error', async () => {
    const app = buildApp({
      verify: jest.fn().mockRejectedValue(new HumonicsError('NETWORK_ERROR', 'RPC down')),
    });
    const res = await app.inject({ method: 'GET', url: `/v1/verify/${VALID_HASH}` });
    expect(res.statusCode).toBe(503);
    expect(res.json().error).toBe('NETWORK_ERROR');
  });

  it('never exposes stack traces', async () => {
    const app = buildApp({
      verify: jest.fn().mockRejectedValue(new Error('internal boom')),
    });
    const res = await app.inject({ method: 'GET', url: `/v1/verify/${VALID_HASH}` });
    expect(res.statusCode).toBe(500);
    expect(JSON.stringify(res.json())).not.toMatch(/stack|at Object|at Module/);
  });
});

describe('GET /v1/certificates/:certId', () => {
  it('returns certificate for a valid certId', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/v1/certificates/cert_abc123' });
    expect(res.statusCode).toBe(200);
    expect(res.json().certificate.id).toBe('cert_abc123');
  });

  it('returns 404 when not certified', async () => {
    const app = buildApp({
      verify: jest.fn().mockResolvedValue({ certified: false }),
    });
    const res = await app.inject({ method: 'GET', url: '/v1/certificates/cert_missing' });
    expect(res.statusCode).toBe(404);
  });
});
