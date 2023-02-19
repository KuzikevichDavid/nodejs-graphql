import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import { idNotFound } from '../replyMessages';
import { __Schema } from 'graphql';

const ENTITY_NAME = 'user';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  const unsubscribe = (
    subscriber: UserEntity,
    bloger: UserEntity
  ): Promise<UserEntity> | undefined => {
    const index = subscriber.subscribedToUserIds.findIndex((id) => id === bloger.id);
    if (index === -1) return;
    subscriber.subscribedToUserIds.splice(index, 1);
    return fastify.db.users.change(subscriber.id, {
      subscribedToUserIds: subscriber.subscribedToUserIds
    });
  };

  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema
      }
    },
    async function (request, reply): Promise<UserEntity | null> {
      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id
      });
      if (!user) {
        reply.notFound(idNotFound(ENTITY_NAME, request.params.id));
      }
      return user;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema
      }
    },
    async function (request, reply): Promise<UserEntity | undefined> {
      const user = {
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        email: request.body.email
      };
      return fastify.db.users.create(user);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema
      }
    },
    async function (request, reply): Promise<UserEntity | undefined> {
      const userToDelete = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id
      });
      if (!userToDelete) {
        reply.badRequest(idNotFound(ENTITY_NAME, request.params.id));
        return;
      }

      try {
        const postsToDelete = await fastify.db.posts.findMany({ key: 'userId', equals: userToDelete.id });
        postsToDelete.forEach(async (post) => await fastify.db.posts.delete(post.id));

        const profileToDelete = await fastify.db.profiles.findOne({ key: 'userId', equals: userToDelete.id });
        if (profileToDelete) await fastify.db.profiles.delete(profileToDelete.id);

        const subscribers = await fastify.db.users.findMany({
          key: 'subscribedToUserIds',
          inArray: request.params.id
        });
        subscribers.forEach((s) => unsubscribe(s, userToDelete));

        await fastify.db.users.delete(userToDelete.id);
        reply.code(204);
        return;
      } catch (err: unknown) {
        if (err instanceof Error) {
          reply.internalServerError(err.message);
          return;
        }
        reply.internalServerError();
        return;
      }
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema
      }
    },
    async function (request, reply): Promise<UserEntity | undefined> {
      const users = await fastify.db.users.findMany({
        key: 'id',
        equalsAnyOf: [request.params.id, request.body.userId]
      });
      const bloger = users.find((u) => u.id === request.params.id);
      const subscriber = users.find((u) => u.id === request.body.userId);

      if (!subscriber || !bloger) {
        let msg = '';
        if (!subscriber) msg += idNotFound(ENTITY_NAME, request.params.id);
        if (!bloger) {
          if (msg.length > 0) msg += ' ';
          msg += idNotFound(ENTITY_NAME, request.body.userId);
        }
        reply.notFound(msg);
        return;
      }
      subscriber.subscribedToUserIds.push(bloger.id);
      return fastify.db.users.change(subscriber.id, {
        subscribedToUserIds: subscriber.subscribedToUserIds
      });
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema
      }
    },
    async function (request, reply): Promise<UserEntity | undefined> {
      const users = await fastify.db.users.findMany({
        key: 'id',
        equalsAnyOf: [request.params.id, request.body.userId]
      });
      const bloger = users.find((u) => u.id === request.params.id);
      const subscriber = users.find((u) => u.id === request.body.userId);

      if (!subscriber || !bloger) {
        let msg = '';
        if (!subscriber) msg += idNotFound(ENTITY_NAME, request.params.id);
        if (!bloger) {
          if (msg.length > 0) msg += ' ';
          msg += idNotFound(ENTITY_NAME, request.body.userId);
        }
        reply.badRequest(msg);
        return;
      }
      const result = unsubscribe(subscriber, bloger);
      if (!result) {
        reply.badRequest();
        return;
      }
      return result;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema
      }
    },
    async function (request, reply): Promise<UserEntity | undefined> {
      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id
      });
      if (!user) {
        reply.badRequest(idNotFound(ENTITY_NAME, request.params.id));
        return;
      }
      return fastify.db.users.change(user.id, request.body);
    }
  );
};

export default plugin;
