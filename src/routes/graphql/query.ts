import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString
} from 'graphql';
import { Context } from '.';
import { userType, postType, profileType, memberType } from './types';

export const rootQuery: GraphQLObjectType = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    user: {
      type: userType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      async resolve(parent, args, context: Context) {
        return context.loader.usersById.load(args.id);
      }
    },
    users: {
      type: new GraphQLList(userType),
      async resolve(parent, args, context: Context) {
        return context.loader.toCacheUsers(await context.db.users.findMany());
      }
    },
    post: {
      type: postType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      async resolve(parent, args, context: Context) {
        return context.loader.postsById.load(args.id);
      }
    },
    posts: {
      type: new GraphQLList(postType),
      async resolve(parent, args, context: Context) {
        return context.loader.toCachePosts(await context.db.posts.findMany());
      }
    },
    profile: {
      type: profileType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      async resolve(parent, args, context: Context) {
        return context.loader.profilesById.load(args.id);
      }
    },
    profiles: {
      type: new GraphQLList(profileType),
      async resolve(parent, args, context: Context) {
        return context.loader.toCacheProfiles(await context.db.profiles.findMany());
      }
    },
    memberType: {
      type: memberType,
      args: { id: { type: new GraphQLNonNull(GraphQLString) } },
      async resolve(parent, args, context: Context) {
        return context.loader.membersById.load(args.id);
      }
    },
    memberTypes: {
      type: new GraphQLList(memberType),
      async resolve(parent, args, context: Context) {
        return context.loader.toCache(
          await context.db.memberTypes.findMany(),
          context.loader.membersById
        );
      }
    }
  }
});
