import type { FastifyInstance } from 'fastify';
import { HumonicsError } from '@humonics/sdk';

export function registerCertificatesRoute(app: FastifyInstance): void {
  app.get<{ Params: { certId: string } }>(
    '/v1/certificates/:certId',
    async (request, reply) => {
      const { certId } = request.params;

      if (!certId?.trim()) {
        return reply.status(400).send({ error: 'INVALID_INPUT', message: 'certId is required' });
      }

      // verify() by certId — SDK resolves the certificate from the registry
      // We use a dedicated lookup; if not found the SDK returns certified: false
      const result = await app.sdk.verify(certId).catch((err: unknown) => {
        if (err instanceof HumonicsError && err.code === 'INVALID_INPUT') {
          // certId is not a contentHash — look up by ID directly
          // TODO: expose getCertificate(certId) in SDK v0.2
          throw new HumonicsError('CONTENT_NOT_CERTIFIED', 'Certificate not found');
        }
        throw err;
      });

      if (!result.certified || !result.certificate) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: 'Certificate not found' });
      }

      return reply.status(200).send({ certificate: result.certificate });
    },
  );
}
