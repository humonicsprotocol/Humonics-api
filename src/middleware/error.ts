import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { HumonicsError } from '@humonics/sdk';

const ERROR_STATUS: Record<string, number> = {
  CONTENT_NOT_CERTIFIED: 200,
  CERTIFICATE_REVOKED:   200,
  INVALID_PROOF:         400,
  INVALID_INPUT:         400,
  NETWORK_ERROR:         503,
  CONTRACT_ERROR:        503,
};

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err, request: FastifyRequest, reply: FastifyReply) => {
    if (err instanceof HumonicsError) {
      const status = ERROR_STATUS[err.code] ?? 500;
      // Never return stack traces
      return reply.status(status).send({ error: err.code, message: err.message });
    }

    // Log with request ID only — never log content hashes or API keys
    app.log.error({ reqId: request.id, err: err.message }, 'Unhandled error');
    return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' });
  });
}
