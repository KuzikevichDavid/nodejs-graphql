import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphql } from 'graphql';
import { createSchema, graphqlBodySchema } from './schema';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  const graphqlSchema = createSchema(fastify.db);
  const resolveGraphql = (source: string) =>
    graphql({ schema: graphqlSchema, source: source });

  fastify.post(
    '/',
    {
      schema: {
        body: graphqlBodySchema
      }
    },
    async function (request, reply) {
      if (request.body?.query) return resolveGraphql(request.body?.query);
      if (request.body?.mutation) return resolveGraphql(request.body?.mutation);
      return reply.badRequest();
    }
  );
};

export default plugin;
