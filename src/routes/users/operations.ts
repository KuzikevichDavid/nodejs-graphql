import DB from '../../utils/DB/DB';
import { UserEntity } from '../../utils/DB/entities/DBUsers';
import { BadRequest } from '../errors/badRequest.error';
import { NotFound } from '../errors/notFound.error';
import { idNotFound } from '../replyMessages';

const enum Operations {
  subscribe = 'subscribe',
  unsubscribe = 'unsubscribe',
  delete = 'delete'
}

export interface UserOpeations {
  ENTITY_NAME: string;
  deleteUser(deleteId: string): Promise<UserEntity>;
  unsubscribeUser(subscriberId: string, blogerId: string): Promise<UserEntity>;
  subscribeUser(subscriberId: string, blogerId: string): Promise<UserEntity>;
}

const ENTITY_NAME = 'user';

export let userOperations: UserOpeations;

export const initUserOperations = (db: DB) => {
  const subscribe = (subscriber: UserEntity, bloger: UserEntity): Promise<UserEntity> => {
    subscriber.subscribedToUserIds.push(bloger.id);
    return db.users.change(subscriber.id, {
      subscribedToUserIds: subscriber.subscribedToUserIds
    });
  };

  const unsubscribe = (
    subscriber: UserEntity,
    bloger: UserEntity
  ): Promise<UserEntity> | undefined => {
    const index = subscriber.subscribedToUserIds.findIndex((id) => id === bloger.id);
    if (index === -1) return;
    subscriber.subscribedToUserIds.splice(index, 1);
    return db.users.change(subscriber.id, {
      subscribedToUserIds: subscriber.subscribedToUserIds
    });
  };

  const deleteUser = async (deleteId: string) => {
    const userToDelete = await db.users.findOne({
      key: 'id',
      equals: deleteId
    });

    if (!userToDelete) {
      throw new BadRequest(Operations.delete, idNotFound(ENTITY_NAME, deleteId));
    }

    const postsToDelete = await db.posts.findMany({ key: 'userId', equals: userToDelete.id });
    postsToDelete.forEach(async (post) => await db.posts.delete(post.id));

    const profileToDelete = await db.profiles.findOne({ key: 'userId', equals: userToDelete.id });
    if (profileToDelete) await db.profiles.delete(profileToDelete.id);

    const subscribers = await db.users.findMany({
      key: 'subscribedToUserIds',
      inArray: deleteId
    });
    subscribers.forEach((s) => unsubscribe(s, userToDelete));

    return await db.users.delete(userToDelete.id);
  };

  const subscribeUser = async (subscriberId: string, blogerId: string) => {
    const users = await db.users.findMany({
      key: 'id',
      equalsAnyOf: [subscriberId, blogerId]
    });
    const bloger = users.find((u) => u.id === blogerId);
    const subscriber = users.find((u) => u.id === subscriberId);

    if (!subscriber || !bloger) {
      let msg = '';
      if (!subscriber) msg += idNotFound(ENTITY_NAME, subscriberId);
      if (!bloger) {
        if (msg.length > 0) msg += ' ';
        msg += idNotFound(ENTITY_NAME, blogerId);
      }
      throw new NotFound(Operations.subscribe, msg);
    }

    return subscribe(subscriber, bloger);
  };

  const unsubscribeUser = async (subscriberId: string, blogerId: string) => {
    const users = await db.users.findMany({
      key: 'id',
      equalsAnyOf: [blogerId, subscriberId]
    });
    const bloger = users.find((u) => u.id === blogerId);
    const subscriber = users.find((u) => u.id === subscriberId);

    if (!subscriber || !bloger) {
      let msg = '';
      if (!subscriber) msg += idNotFound(ENTITY_NAME, subscriberId);
      if (!bloger) {
        if (msg.length > 0) msg += ' ';
        msg += idNotFound(ENTITY_NAME, blogerId);
      }
      throw new BadRequest(Operations.unsubscribe, msg);
    }
    const result = unsubscribe(subscriber, bloger);
    if (!result) {
      throw new BadRequest(
        Operations.unsubscribe,
        `user with id ${subscriberId} not follow on user with id ${blogerId}`
      );
    }
    return result;
  };

  userOperations = {
    deleteUser: deleteUser,
    unsubscribeUser: unsubscribeUser,
    subscribeUser: subscribeUser,
    ENTITY_NAME: ENTITY_NAME
  };
};
