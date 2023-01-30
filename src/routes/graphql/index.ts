import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import DataLoader = require('dataloader');
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import { graphql, parse, validate } from 'graphql';
import depthLimit = require('graphql-depth-limit');
import { graphqlBodySchema, schema } from './schema';
import { ProfileEntity } from '../../utils/DB/entities/DBProfiles';
import { PostEntity } from '../../utils/DB/entities/DBPosts';
import { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';
import DB from '../../utils/DB/DB';
import { initPostOperations, postOperations, PostOperations } from '../posts/operations';
import {
  initProfileOperations,
  profileOperations,
  ProfileOperations
} from '../profiles/operations';
import { initUserOperations, UserOpeations, userOperations } from '../users/operations';

export interface Loader {
  usersById: DataLoader<string, UserEntity, string>;
  postsById: DataLoader<string, PostEntity, string>;
  profilesById: DataLoader<string, ProfileEntity, string>;
  membersById: DataLoader<string, MemberTypeEntity, string>;
  postsByUserId: DataLoader<string, PostEntity, string>;
  profilesByUserId: DataLoader<string, ProfileEntity, string>;
  subscribedToByUserId: DataLoader<string, (UserEntity | Error)[], string>;
  toCacheUsers: (entities: UserEntity[]) => UserEntity[];
  toCachePosts: (entities: PostEntity[]) => PostEntity[];
  toCacheProfiles: (entities: ProfileEntity[]) => ProfileEntity[];
  toCache: (
    entities: Array<{ id: string }>,
    loader: DataLoader<string, { id: string }, string>
  ) => Array<{ id: string }>;
}

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
  const finder = async (
    keys: readonly string[],
    finder: (args: object) => Promise<Array<any>>,
    args: object
  ) => {
    const results = await finder(args);
    return keys.map((key, i) => results[i] || new Error(`No result for ${key}`));
  };

  const toCache = (
    entities: Array<{ id: string }>,
    loader: DataLoader<string, { id: string }, string>
  ) => {
    entities.forEach((e) => loader.prime(e.id, e));
    return entities;
  };
  // users
  const loadUsers = async (keys: readonly string[]) => {
    console.log('loadUsers');
    const users = await fastify.db.users.findMany({ key: 'id', equalsAnyOf: keys });
    const res: Record<string, UserEntity[]> = {};
    users.forEach((u) => {
      console.log('loadUsers forEach user');
      u.subscribedToUserIds.forEach((uu) => {
        u.subscribedToUserIds.forEach((uu) => {
          if (!res[uu]) res[uu] = [];
          res[uu].push(u);
        });
      });
    });
    for (const k of Object.keys(res)) {
      loader.subscribedToByUserId.prime(k, res[k]);
    }
    return users;
  };
  const toCacheUsers = (users: UserEntity[]) => {
    console.log('toCacheUsers');
    const res: Record<string, UserEntity[]> = {};
    users.forEach((u) => {
      loader.usersById.prime(u.id, u);
      u.subscribedToUserIds.forEach((uu) => {
        if (!res[uu]) res[uu] = [];
        res[uu].push(u);
      });
      if (!res[u.id]) res[u.id] = [];
    });
    for (const k of Object.keys(res)) {
      loader.subscribedToByUserId.prime(k, res[k]);
    }

    return users;
  };
  const userLoader = new DataLoader(loadUsers);
  // subscribedToByUserId
  const loadSubscribedToByUserId = async (keys: readonly string[]) => {
    console.log('loadSubscribedToByUserId', keys);
    const results = await fastify.db.users.findMany({
      key: 'subscribedToUserIds',
      inArrayAnyOf: new Array(...keys)
    });
    const res: (UserEntity | Error)[][] = new Array<(UserEntity | Error)[]>(keys.length);
    keys.forEach((k, i) => {
      res[i] = [];
      res[i].push(
        ...results.filter((u) => u.subscribedToUserIds.findIndex((x) => x === k) >= 0)
      );
    });
    return res;
  };
  const subscribedToByUserId = new DataLoader(loadSubscribedToByUserId);
  // post
  const loadPosts = async (keys: readonly string[]) => {
    console.log('loadPosts');
    const res = await fastify.db.posts.findMany({ key: 'id', equalsAnyOf: keys });
    res.forEach((e) => loader.postsByUserId.prime(e.userId, e));
    return res;
  };
  const toCachePosts = (posts: PostEntity[]) => {
    posts.forEach((e) => {
      loader.postsById.prime(e.id, e);
      loader.postsByUserId.prime(e.userId, e);
    });
    return posts;
  };
  const postLoader = new DataLoader(loadPosts);
  // postsByUserId
  const loadPostsByUserId = async (keys: readonly string[]) => {
    console.log('loadPostsByUserId');
    return await fastify.db.posts.findMany({ key: 'userId', equalsAnyOf: keys });
  };
  const postsByUserIdLoader = new DataLoader(loadPostsByUserId);
  // profile
  const loadProfile = async (keys: readonly string[]) => {
    console.log('loadProfile');
    const res = await fastify.db.profiles.findMany({ key: 'id', equalsAnyOf: keys });
    res.forEach((e) => loader.profilesByUserId.prime(e.userId, e));
    return res;
  };
  const toCacheProfiles = (profiles: ProfileEntity[]) => {
    profiles.forEach((e) => {
      loader.profilesById.prime(e.id, e);
      loader.profilesByUserId.prime(e.userId, e);
    });
    return profiles;
  };
  const profileLoader = new DataLoader(loadProfile);
  // profilesByUserId
  const loadProfilesByUserId = (keys: readonly string[]) => {
    console.log('loadProfilesByUserId');
    return fastify.db.profiles.findMany({ key: 'userId', equalsAnyOf: keys });
  };
  const profilesByUserIdLoader = new DataLoader(loadProfilesByUserId);

  const loader: Loader = {
    toCache: toCache,
    toCacheUsers: toCacheUsers,
    toCachePosts: toCachePosts,
    toCacheProfiles: toCacheProfiles,
    usersById: userLoader,
    postsById: postLoader,
    profilesById: profileLoader,
    membersById: new DataLoader((keys) =>
      finder(keys, fastify.db.memberTypes.findMany, { key: 'id', equalsAnyOf: keys })
    ),
    postsByUserId: postsByUserIdLoader,
    profilesByUserId: profilesByUserIdLoader,
    subscribedToByUserId: subscribedToByUserId
  };
  /* const loader: Loader = {
    toCache: toCache,
    usersById: new DataLoader((keys) => finder(keys, fastify.db.users.findMany, { key: 'id', equalsAnyOf: keys })),
    postsById: new DataLoader((keys) => finder(keys, fastify.db.posts.findMany, { key: 'id', equalsAnyOf: keys })),
    profilesById: new DataLoader((keys) => finder(keys, fastify.db.profiles.findMany, { key: 'id', equalsAnyOf: keys })),
    membersById: new DataLoader((keys) => finder(keys, fastify.db.memberTypes.findMany, { key: 'id', equalsAnyOf: keys })),
    postsByUserId: new DataLoader((keys) => finder(keys, fastify.db.posts.findMany, { key: 'userId', equalsAnyOf: keys })),
    profilesByUserId: new DataLoader((keys) => finder(keys, fastify.db.profiles.findMany, { key: 'userId', equalsAnyOf: keys })),
    subscribedToByUserId: new DataLoader((keys) => finder(keys, fastify.db.users.findMany, { key: 'subscribedToUserIds', inArray: keys }))
  } */

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

  const resolveGraphql = (
    source: string,
    variables: { [x: string]: unknown } | undefined
  ) => {
    const validation_errors = validate(schema, parse(source), [depthLimit(5)]);
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
      if (request.body?.query)
        return resolveGraphql(request.body?.query, request.body?.variables);
      if (request.body?.mutation)
        return resolveGraphql(request.body?.mutation, request.body?.variables);
      return reply.badRequest();
    }
  );
};

export default plugin;
