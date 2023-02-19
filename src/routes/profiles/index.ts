import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';
import { existsWithEntityId, idNotFound } from '../replyMessages';

const ENTITY_NAME = 'profile';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<ProfileEntity[]> {
    return fastify.db.profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema
      }
    },
    async function (request, reply): Promise<ProfileEntity | undefined> {
      const profile = await fastify.db.profiles.findOne({
        key: 'id',
        equals: request.params.id
      });
      if (!profile) {
        reply.notFound(idNotFound(ENTITY_NAME, request.params.id));
        return;
      }
      return profile;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema
      }
    },
    async function (request, reply): Promise<ProfileEntity | undefined> {
      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: request.body.userId
      });
      if (!user) {
        reply.badRequest(idNotFound('user', request.body.userId));
        return;
      }

      const profile = await fastify.db.profiles.findOne({
        key: 'userId',
        equals: request.body.userId
      });
      if (profile) {
        reply.badRequest(existsWithEntityId(ENTITY_NAME, request.body.userId));
        return;
      }

      const member = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: request.body.memberTypeId
      });
      if (!member) {
        reply.badRequest(idNotFound('member-type', request.body.memberTypeId));
        return;
      }

      return fastify.db.profiles.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema
      }
    },
    async function (request, reply): Promise<ProfileEntity | undefined> {
      const profile = await fastify.db.profiles.findOne({
        key: 'id',
        equals: request.params.id
      });
      if (!profile) {
        reply.badRequest(idNotFound(ENTITY_NAME, request.params.id));
        return;
      }

      return fastify.db.profiles.delete(profile.id);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema
      }
    },
    async function (request, reply): Promise<ProfileEntity | undefined> {
      const profile = await fastify.db.profiles.findOne({
        key: 'id',
        equals: request.params.id
      });
      if (!profile) {
        reply.badRequest(idNotFound(ENTITY_NAME, request.params.id));
        return;
      }

      return fastify.db.profiles.change(profile.id, request.body);
    }
  );
};

export default plugin;
