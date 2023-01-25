import { FastifyInstance } from "fastify";
import { GraphQLObjectType, GraphQLID, GraphQLString, GraphQLList, GraphQLInt, GraphQLNonNull, GraphQLSchema } from "graphql";

export const graphqlBodySchema = {
  type: 'object',
  properties: {
    mutation: { type: 'string' },
    query: { type: 'string' },
    variables: {
      type: 'object',
    },
  },
  oneOf: [
    {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string' },
        variables: {
          type: 'object',
        },
      },
      additionalProperties: false,
    },
    {
      type: 'object',
      required: ['mutation'],
      properties: {
        mutation: { type: 'string' },
        variables: {
          type: 'object',
        },
      },
      additionalProperties: false,
    },
  ],
} as const;

export const createSchem = (fastify: FastifyInstance): GraphQLSchema => {

  const userType: GraphQLObjectType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
      id: { type: GraphQLID },
      firstName: { type: GraphQLString },
      lastName: { type: GraphQLString },
      email: { type: GraphQLString },
      subscribedToUserIds: { type: new GraphQLList(GraphQLID) },
      profile: {
        type: new GraphQLList(profileType),
        async resolve(parent, args) {
          return fastify.db.profiles.findMany({ key: 'userId', equals: parent.id })
        }
      },
      posts: {
        type: new GraphQLList(postType),
        async resolve(parent, args) {
          return fastify.db.posts.findMany({ key: 'userId', equals: parent.id })
        }
      },
      subscribers: {
        type: new GraphQLList(userType),
        async resolve(parent, args) {
          return fastify.db.users.findMany({ key: 'id', equalsAnyOf: parent.subscribedToUserIds })
        }
      }
    })
  });

  const postType = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
      id: { type: GraphQLID },
      title: { type: GraphQLString },
      content: { type: GraphQLString },
      userId: { type: GraphQLID },
      user: {
        type: userType,
        async resolve(parent, args) {
          return fastify.db.users.findOne({ key: 'id', equals: parent.userId })
        }
      }
    })
  });

  const profileType = new GraphQLObjectType({
    name: 'Profile',
    fields: () => ({
      id: { type: GraphQLID },
      avatar: { type: GraphQLString },
      sex: { type: GraphQLString },
      birthday: { type: GraphQLInt },
      country: { type: GraphQLString },
      street: { type: GraphQLString },
      city: { type: GraphQLString },
      memberTypeId: { type: GraphQLString },
      userId: { type: GraphQLID },
      user: {
        type: userType,
        async resolve(parent, args) {
          return fastify.db.users.findOne({ key: 'id', equals: parent.userId })
        }
      },
      memberType: {
        type: memberType,
        async resolve(parent, args) {
          return fastify.db.memberTypes.findOne({ key: 'id', equals: parent.memberTypeId })
        }
      },
    })
  });

  const memberType = new GraphQLObjectType({
    name: 'MemberType',
    fields: () => ({
      id: { type: GraphQLString },
      discount: { type: GraphQLInt },
      monthPostsLimit: { type: GraphQLInt }
    })
  });

  /* const createTypeGetOne = (type: GraphQLObjectType, base: DBEntity) => {
    return {
      type: type,
      args: { id: { type: GraphQLID } },
      async resolve(parent, args) {
        return base.findOne({ key: 'id', equals: args.id })
      }
    };
  }; */

  const rootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      user: {
        type: userType,
        args: { id: { type: GraphQLID } },
        async resolve(parent, args) {
          return fastify.db.users.findOne({ key: 'id', equals: args.id })
        }
      },
      users: {
        type: new GraphQLList(userType),
        async resolve(parent, args) {
          return await fastify.db.users.findMany();
        }
      },
      post: {
        type: postType,
        args: { id: { type: GraphQLID } },
        async resolve(parent, args) {
          return fastify.db.posts.findOne({ key: 'id', equals: args.id })
        }
      },
      posts: {
        type: new GraphQLList(postType),
        async resolve(parent, args) {
          return await fastify.db.posts.findMany();
        }
      },
      profile: {
        type: profileType,
        args: { id: { type: GraphQLID } },
        async resolve(parent, args) {
          return fastify.db.profiles.findOne({ key: 'id', equals: args.id })
        }
      },
      profiles: {
        type: new GraphQLList(profileType),
        async resolve(parent, args) {
          return await fastify.db.profiles.findMany();
        }
      },
      memberTypes: {
        type: new GraphQLList(memberType),
        async resolve(parent, args) {
          return fastify.db.profiles.findMany()
        }
      }
    }
  })

  const mutations = new GraphQLObjectType({
    name: 'Mutations',
    fields: {
      addUser: {
        type: userType,
        args: {
          firstName: { type: GraphQLString },
          lastName: { type: GraphQLString },
          email: { type: GraphQLString }
        },
        async resolve(parent, args) {
          return fastify.db.users.create(args);
        }
      },
      editUser: {
        type: userType,
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          firstName: { type: GraphQLString },
          lastName: { type: GraphQLString },
          email: { type: GraphQLString }
        },
        async resolve(parent, args) {
          return fastify.db.users.change(args.id, args);
        }
      },
      deleteUser: {
        type: userType,
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) }
        },
        async resolve(parent, args) {
          return fastify.db.users.delete(args.id);
        }
      }
    }
  })

  return new GraphQLSchema({
    query: rootQuery,
    mutation: mutations
  })
}