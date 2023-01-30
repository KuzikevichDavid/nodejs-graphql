import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphql, parse, validate } from 'graphql';
import depthLimit = require('graphql-depth-limit');
import { graphqlBodySchema, schema } from './schema';
import DB from '../../utils/DB/DB';
import { initPostOperations, postOperations, PostOperations } from '../posts/operations';
import {
  initProfileOperations,
  profileOperations,
  ProfileOperations
} from '../profiles/operations';
import { initUserOperations, UserOpeations, userOperations } from '../users/operations';
import { initLoader, Loader } from './loader';

interface Operations {
  user: UserOpeations;
  profile: ProfileOperations;
  post: PostOperations;
}

export interface Context {
  loader: Loader;
  db: DB;
  operations: Operations;
}

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  const clearCache = () => {
    loader.membersById.clearAll();
    loader.usersById.clearAll();
    loader.subscribedToByUserId.clearAll()
    loader.postsById.clearAll();
    loader.postsByUserId.clearAll();
    loader.profilesById.clearAll()
    loader.profilesByUserId.clearAll();
  }

  const loader: Loader = initLoader(fastify.db)

  initPostOperations(fastify.db);
  initUserOperations(fastify.db);
  initProfileOperations(fastify.db);

  const context: Context = {
    loader: loader,
    db: fastify.db,
    operations: {
      user: userOperations,
      post: postOperations,
      profile: profileOperations
    }
  };

  const limit = [depthLimit(5)];

  const resolveGraphql = (
    source: string,
    variables: { [x: string]: unknown } | undefined
  ) => {
    const validation_errors = validate(schema, parse(source), limit);
    if (validation_errors.length > 0) return validation_errors;
    return graphql({
      schema: schema,
      source: source,
      contextValue: context,
      variableValues: variables
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
      clearCache();
      if (request.body?.query)
        return resolveGraphql(request.body?.query, request.body?.variables);
      if (request.body?.mutation)
        return resolveGraphql(request.body?.mutation, request.body?.variables);
      return reply.badRequest();
    }
  );
};

export default plugin;
