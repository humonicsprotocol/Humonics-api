import type { FastifyInstance } from 'fastify';

export function registerHealthRoute(app: FastifyInstance, network: string): void {
  app.get('/health', async (_request, reply) => {
    return reply.status(200).send({ status: 'ok', network });
  });
}
