import { GraphQLObjectType, GraphQLID, GraphQLList } from 'graphql';
import DB from '../../utils/DB/DB';
import { userType, postType, profileType, memberType } from './types';

export let rootQuery: GraphQLObjectType;

export const initQLQuery = (db: DB) => {
  rootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      user: {
        type: userType,
        args: { id: { type: GraphQLID } },
        async resolve(parent, args) {
          return db.users.findOne({ key: 'id', equals: args.id });
        }
      },
      users: {
        type: new GraphQLList(userType),
        async resolve(parent, args) {
          return await db.users.findMany();
        }
      },
      post: {
        type: postType,
        args: { id: { type: GraphQLID } },
        async resolve(parent, args) {
          return db.posts.findOne({ key: 'id', equals: args.id });
        }
      },
      posts: {
        type: new GraphQLList(postType),
        async resolve(parent, args) {
          return await db.posts.findMany();
        }
      },
      profile: {
        type: profileType,
        args: { id: { type: GraphQLID } },
        async resolve(parent, args) {
          return db.profiles.findOne({ key: 'id', equals: args.id });
        }
      },
      profiles: {
        type: new GraphQLList(profileType),
        async resolve(parent, args) {
          return await db.profiles.findMany();
        }
      },
      memberTypes: {
        type: new GraphQLList(memberType),
        async resolve(parent, args) {
          return db.profiles.findMany();
        }
      }
    }
  });
};
