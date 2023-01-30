import { GraphQLObjectType, GraphQLNonNull, GraphQLID } from 'graphql';
import { Context } from '.';
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
  profileType,
  memberChangeDTOType,
  memberType
} from './types';

export const mutations: GraphQLObjectType = new GraphQLObjectType({
  name: 'Mutations',
  fields: {
    addUser: {
      type: userType,
      args: {
        input: { type: new GraphQLNonNull(userCreateDTOType) }
      },
      async resolve(parent, args, context: Context) {
        return context.db.users.create(args.input);
      }
    },
    editUser: {
      type: userType,
      args: {
        input: { type: new GraphQLNonNull(userChangeDTOType) }
      },
      async resolve(parent, args, context: Context) {
        return context.db.users.change(args.input.id, args.input);
      }
    },
    deleteUser: {
      type: userType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) }
      },
      async resolve(parent, args, context: Context) {
        return context.operations.user.deleteUser(args.id);
      }
    },
    subscribeTo: {
      type: userType,
      args: {
        input: { type: new GraphQLNonNull(userSubscriptionDTOType) }
      },
      async resolve(parent, args, context: Context) {
        return context.operations.user.subscribeUser(args.input.id, args.input.userId);
      }
    },
    unsubscribeFrom: {
      type: userType,
      args: {
        input: { type: new GraphQLNonNull(userSubscriptionDTOType) }
      },
      async resolve(parent, args, context: Context) {
        return context.operations.user.unsubscribeUser(args.input.id, args.input.userId);
      }
    },
    addPost: {
      type: postType,
      args: {
        input: { type: new GraphQLNonNull(postCreateDTOType) }
      },
      async resolve(parent, args, context: Context) {
        return context.operations.post.createPost(args.input);
      }
    },
    editPost: {
      type: postType,
      args: {
        input: { type: new GraphQLNonNull(postChangeDTOType) }
      },
      async resolve(parent, args, context: Context) {
        return context.db.posts.change(args.input.id, args.input);
      }
    },
    deletePost: {
      type: postType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) }
      },
      async resolve(parent, args, context: Context) {
        return context.db.posts.delete(args.id);
      }
    },
    addProfile: {
      type: profileType,
      args: {
        input: { type: new GraphQLNonNull(profileCreateDTOType) }
      },
      async resolve(parent, args, context: Context) {
        return context.operations.profile.createProfile(args.input);
      }
    },
    editProfile: {
      type: profileType,
      args: {
        input: { type: new GraphQLNonNull(profileChangeDTOType) }
      },
      async resolve(parent, args, context: Context) {
        return context.db.profiles.change(args.input.id, args.input);
      }
    },
    deleteProfile: {
      type: profileType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) }
      },
      async resolve(parent, args, context: Context) {
        return context.db.profiles.delete(args.id);
      }
    },
    editMember: {
      type: memberType,
      args: {
        input: { type: new GraphQLNonNull(memberChangeDTOType) }
      },
      async resolve(parent, args, context: Context) {
        return context.db.memberTypes.change(args.input.id, args.input);
      }
    }
  }
});
