import DB from '../../utils/DB/DB';
import { PostEntity } from '../../utils/DB/entities/DBPosts';
import { BadRequest } from '../errors/badRequest.error';
import { idNotFound } from '../replyMessages';

export interface PostOperations {
  createPost: (createDto: any) => Promise<PostEntity>;
}

export let postOperations: PostOperations;

enum Operations {
  createPost = 'createPost'
}

export const initPostOperations = (db: DB) => {
  const createPost = async (createDto: any) => {
    const user = await db.users.findOne({
      key: 'id',
      equals: createDto.userId
    });
    if (!user) {
      //reply.badRequest(idNotFound('user', body.userId));
      throw new BadRequest(Operations.createPost, idNotFound('user', createDto.userId));
    }

    return db.posts.create(createDto);
  };

  postOperations = { createPost: createPost };
};
