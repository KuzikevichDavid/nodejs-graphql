import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';
import { idNotFound } from '../replyMessages';

const ENTITY_NAME = 'member-type';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<MemberTypeEntity[]> {
    return fastify.db.memberTypes.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema
      }
    },
    async function (request, reply): Promise<MemberTypeEntity | undefined> {
      const memberType = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: request.params.id
      });
      if (!memberType) {
        reply.notFound(idNotFound(ENTITY_NAME, request.params.id));
        return;
      }

      return memberType;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema
      }
    },
    async function (request, reply): Promise<MemberTypeEntity | undefined> {
      const memberType = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: request.params.id
      });
      if (!memberType) {
        reply.badRequest(idNotFound(ENTITY_NAME, request.params.id));
        return;
      }

      return fastify.db.memberTypes.change(memberType.id, request.body);
    }
  );
};

export default plugin;
