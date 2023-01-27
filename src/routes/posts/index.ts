import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';
import { idNotFound } from '../replyMessages';

const ENTITY_NAME = 'post';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    return fastify.db.posts.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema
      }
    },
    async function (request, reply): Promise<PostEntity | undefined> {
      const post = await fastify.db.posts.findOne({
        key: 'id',
        equals: request.params.id
      });
      if (!post) {
        reply.notFound(idNotFound(ENTITY_NAME, request.params.id));
        return;
      }
      return post;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema
      }
    },
    async function (request, reply): Promise<PostEntity | undefined> {
      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: request.body.userId
      });
      if (!user) {
        reply.badRequest(idNotFound('user', request.body.userId));
      }

      return fastify.db.posts.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema
      }
    },
    async function (request, reply): Promise<PostEntity | undefined> {
      const post = await fastify.db.posts.findOne({
        key: 'id',
        equals: request.params.id
      });
      if (!post) {
        reply.badRequest(idNotFound(ENTITY_NAME, request.params.id));
        return;
      }

      return fastify.db.posts.delete(post.id);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema
      }
    },
    async function (request, reply): Promise<PostEntity | undefined> {
      const post = await fastify.db.posts.findOne({
        key: 'id',
        equals: request.params.id
      });
      if (!post) {
        reply.badRequest(idNotFound(ENTITY_NAME, request.params.id));
        return;
      }

      return fastify.db.posts.change(post.id, request.body);
    }
  );
};

export default plugin;
