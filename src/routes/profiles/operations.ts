import DB from '../../utils/DB/DB';
import { ProfileEntity } from '../../utils/DB/entities/DBProfiles';
import { BadRequest } from '../errors/badRequest.error';
import { existsWithEntityId, idNotFound } from '../replyMessages';

export interface ProfileOperations {
  createProfile: (profileDTO: any) => Promise<ProfileEntity>;
}

export let profileOperations: ProfileOperations;

const enum Operations {
  create = 'create'
}

const ENTITY_NAME = 'profile';

export const initProfileOperations = (db: DB) => {
  const createProfile = async (profileDTO: any): Promise<ProfileEntity> => {
    const user = await db.users.findOne({
      key: 'id',
      equals: profileDTO.userId
    });
    if (!user) {
      //reply.badRequest(idNotFound('user', userId));
      //return;
      throw new BadRequest(Operations.create, idNotFound('user', profileDTO.userId));
    }

    const profile = await db.profiles.findOne({
      key: 'userId',
      equals: profileDTO.userId
    });
    if (profile) {
      //reply.badRequest(existsWithEntityId(ENTITY_NAME, userId));
      //return;
      throw new BadRequest(
        Operations.create,
        existsWithEntityId(ENTITY_NAME, profileDTO.userId)
      );
    }

    const member = await db.memberTypes.findOne({
      key: 'id',
      equals: profileDTO.memberTypeId
    });
    if (!member) {
      //reply.badRequest(idNotFound('member-type', memberTypeId));
      //return;
      throw new BadRequest(
        Operations.create,
        idNotFound('member-type', profileDTO.memberTypeId)
      );
    }

    return db.profiles.create(profileDTO);
  };

  profileOperations = { createProfile: createProfile };
};
