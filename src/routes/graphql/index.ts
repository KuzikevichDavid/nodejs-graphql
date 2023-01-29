import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphql, parse, validate } from 'graphql';
import depthLimit = require('graphql-depth-limit');
import { createSchema, graphqlBodySchema } from './schema';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  const graphqlSchema = createSchema(fastify.db);
  const resolveGraphql = (
    source: string,
    variables: { [x: string]: unknown } | undefined
  ) => {
    const validation_errors = validate(graphqlSchema, parse(source), [depthLimit(5)]);
    if (validation_errors.length > 0) return validation_errors;
    return graphql({
      schema: graphqlSchema,
      source: source,
      variableValues: variables /*, contextValue*/
    });
  };

  fastify.post(
    '/',
    {
      schema: {
        body: graphqlBodySchema
      }
    },
    async function (request, reply) {
      if (request.body?.query)
        return resolveGraphql(request.body?.query, request.body?.variables);
      if (request.body?.mutation)
        return resolveGraphql(request.body?.mutation, request.body?.variables);
      return reply.badRequest();
    }
  );
};

export default plugin;
