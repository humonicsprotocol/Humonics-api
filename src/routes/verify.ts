import type { FastifyInstance } from 'fastify';

const CONTENT_HASH_RE = /^[a-f0-9]{64}$/;

export function registerVerifyRoute(app: FastifyInstance): void {
  app.get<{ Params: { contentHash: string } }>(
    '/v1/verify/:contentHash',
    async (request, reply) => {
      const { contentHash } = request.params;

      if (!CONTENT_HASH_RE.test(contentHash)) {
        return reply.status(400).send({ error: 'INVALID_INPUT', message: 'contentHash must be a 64-char hex string' });
      }

      const result = await app.sdk.verify(contentHash);

      return reply.status(200).send(result);
    },
  );
}
