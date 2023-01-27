import { GraphQLObjectType, GraphQLNonNull, GraphQLID } from 'graphql';
import DB from '../../utils/DB/DB';
import { postOperations } from '../posts/operations';
import { profileOperations } from '../profiles/operations';
import { userOperations } from '../users/operations';
import {
  userType,
  userCreateDTOType,
  userChangeDTOType,
  postType,
  postCreateDTOType,
  postChangeDTOType,
  profileCreateDTOType,
  profileChangeDTOType,
  userSubscriptionDTOType,
  profileType
} from './types';

export let mutations: GraphQLObjectType;

export const initQLMutations = (db: DB) => {
  mutations = new GraphQLObjectType({
    name: 'Mutations',
    fields: {
      addUser: {
        type: userType,
        args: {
          input: { type: new GraphQLNonNull(userCreateDTOType) }
        },
        async resolve(parent, args) {
          return db.users.create(args.input);
        }
      },
      editUser: {
        type: userType,
        args: {
          input: { type: new GraphQLNonNull(userChangeDTOType) }
        },
        async resolve(parent, args) {
          return db.users.change(args.input.id, args.input);
        }
      },
      deleteUser: {
        type: userType,
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) }
        },
        async resolve(parent, args) {
          return userOperations.deleteUser(args.id);
        }
      },
      subscribeTo: {
        type: userType,
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          input: { type: new GraphQLNonNull(userSubscriptionDTOType) }
        },
        async resolve(parent, args) {
          return userOperations.subscribeUser(args.input.id, args.input.userId);
        }
      },
      unsubscribeFrom: {
        type: userType,
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          input: { type: new GraphQLNonNull(userSubscriptionDTOType) }
        },
        async resolve(parent, args) {
          return userOperations.unsubscribeUser(args.input.id, args.input.UserId);
        }
      },
      addPost: {
        type: postType,
        args: {
          input: { type: new GraphQLNonNull(postCreateDTOType) }
        },
        async resolve(parent, args) {
          return postOperations.createPost(args.input);
        }
      },
      editPost: {
        type: postType,
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          input: { type: new GraphQLNonNull(postChangeDTOType) }
        },
        async resolve(parent, args) {
          return db.posts.change(args.input.id, args.input);
        }
      },
      deletePost: {
        type: postType,
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) }
        },
        async resolve(parent, args) {
          return db.posts.delete(args.id);
        }
      },
      addProfile: {
        type: profileType,
        args: {
          input: { type: new GraphQLNonNull(profileCreateDTOType) }
        },
        async resolve(parent, args) {
          return profileOperations.createProfile(args.input);
        }
      },
      editProfile: {
        type: profileType,
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          input: { type: new GraphQLNonNull(profileChangeDTOType) }
        },
        async resolve(parent, args) {
          return db.profiles.change(args.id, args.input);
        }
      },
      deleteProfile: {
        type: profileType,
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) }
        },
        async resolve(parent, args) {
          return db.profiles.delete(args.id);
        }
      }
    }
  });
};
