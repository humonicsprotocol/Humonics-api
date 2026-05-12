import type { HumonicsClient } from '@humonics/sdk';

interface VerificationResult {
  certified: boolean;
  certificate?: typeof MOCK_CERT;
  revoked?: boolean;
}

export const MOCK_CERT = {
  id: 'cert_abc123',
  contentHash: 'a'.repeat(64),
  did: 'did:stellar:GABC',
  contentType: 'text' as const,
  issuedAt: 1700000000,
  txHash: 'txhash_abc',
  revoked: false,
};

export function mockSdk(overrides: Partial<HumonicsClient> = {}): HumonicsClient {
  return {
    verify: jest.fn().mockResolvedValue({ certified: true, certificate: MOCK_CERT } as VerificationResult),
    batchVerify: jest.fn().mockResolvedValue([]),
    issue: jest.fn(),
    revoke: jest.fn(),
    ...overrides,
  } as unknown as HumonicsClient;
}

export function mockRedis(overrides: Record<string, jest.Mock> = {}) {
  return {
    sismember: jest.fn().mockResolvedValue(1), // valid free-tier key by default
    ...overrides,
  };
}
