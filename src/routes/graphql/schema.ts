//import DataLoader = require("dataloader");
import { GraphQLSchema } from 'graphql';
import DB from '../../utils/DB/DB';
import { initPostOperations } from '../posts/operations';
import { initProfileOperations } from '../profiles/operations';
import { initUserOperations } from '../users/operations';
import { initQLMutations, mutations } from './mutations';
import { initQLQuery, rootQuery } from './query';
import { initQLTypes } from './types';

export const graphqlBodySchema = {
  type: 'object',
  properties: {
    mutation: { type: 'string' },
    query: { type: 'string' },
    variables: {
      type: 'object'
    }
  },
  oneOf: [
    {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string' },
        variables: {
          type: 'object'
        }
      },
      additionalProperties: false
    },
    {
      type: 'object',
      required: ['mutation'],
      properties: {
        mutation: { type: 'string' },
        variables: {
          type: 'object'
        }
      },
      additionalProperties: false
    }
  ]
} as const;

export const createSchema = (db: DB): GraphQLSchema => {
  /* const loadUser = (keys: readonly string[]) => {
    //const ids: string[] = keys;
    return fastify.db.users.findMany({ key: 'id', equalsAnyOf: keys })
  }
  const userLoaderById = new DataLoader(loadUser) */
  initPostOperations(db);
  initUserOperations(db);
  initProfileOperations(db);
  initQLTypes(db);
  initQLQuery(db);
  initQLMutations(db);

  return new GraphQLSchema({
    query: rootQuery,
    mutation: mutations
  });
};
