import {
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql';
import { Context } from '.';

export const memberType = new GraphQLObjectType({
  name: 'MemberType',
  fields: () => ({
    id: { type: GraphQLString },
    discount: { type: GraphQLInt },
    monthPostsLimit: { type: GraphQLInt }
  })
});

export const userType: GraphQLObjectType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLID },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    subscribedToUserIds: { type: new GraphQLList(GraphQLID) },
    profile: {
      type: profileType,
      async resolve(parent, args, context: Context) {
        return context.loader.profilesByUserId.load(parent.id);
      }
    },
    posts: {
      type: new GraphQLList(postType),
      async resolve(parent, args, context: Context) {
        return context.loader.postsByUserId.loadMany(parent.id);
      }
    },
    subscribedToUser: {
      type: new GraphQLList(userType),
      async resolve(parent, args, context: Context) {
        return context.loader.usersById.loadMany(parent.subscribedToUserIds);
      }
    },
    userSubscribedTo: {
      type: new GraphQLList(userType),
      async resolve(parent, args, context: Context) {
        return context.loader.subscribedToByUserId.load(parent.id);
      }
    }
  })
});

export const postType = new GraphQLObjectType({
  name: 'Post',
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    userId: { type: GraphQLID },
    user: {
      type: userType,
      async resolve(parent, args, context: Context) {
        return context.loader.usersById.load(parent.userId);
      }
    }
  })
});

export const profileType = new GraphQLObjectType({
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
      async resolve(parent, args, context: Context) {
        return context.loader.usersById.load(parent.userId);
      }
    },
    memberType: {
      type: memberType,
      async resolve(parent, args, context: Context) {
        return context.loader.membersById.load(parent.memberTypeId);
      }
    }
  })
});

export const userCreateDTOType = new GraphQLInputObjectType({
  name: 'userCreateDTO',
  fields: {
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) }
  }
});

export const userChangeDTOType = new GraphQLInputObjectType({
  name: 'userChangeDTO',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString }
  }
});

export const userSubscriptionDTOType = new GraphQLInputObjectType({
  name: 'userSubscriptionDTO',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    userId: { type: new GraphQLNonNull(GraphQLID) }
  }
});

export const postCreateDTOType = new GraphQLInputObjectType({
  name: 'postCreateDTO',
  fields: {
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: new GraphQLNonNull(GraphQLID) }
  }
});

export const postChangeDTOType = new GraphQLInputObjectType({
  name: 'postChangeDTO',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: GraphQLString },
    content: { type: GraphQLString }
  }
});

export const profileCreateDTOType = new GraphQLInputObjectType({
  name: 'profileCreateDTO',
  fields: {
    avatar: { type: new GraphQLNonNull(GraphQLString) },
    sex: { type: new GraphQLNonNull(GraphQLString) },
    birthday: { type: new GraphQLNonNull(GraphQLInt) },
    country: { type: new GraphQLNonNull(GraphQLString) },
    street: { type: new GraphQLNonNull(GraphQLString) },
    city: { type: new GraphQLNonNull(GraphQLString) },
    memberTypeId: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: new GraphQLNonNull(GraphQLID) }
  }
});

export const profileChangeDTOType = new GraphQLInputObjectType({
  name: 'profileChangeDTO',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    avatar: { type: GraphQLString },
    sex: { type: GraphQLString },
    birthday: { type: GraphQLInt },
    country: { type: GraphQLString },
    street: { type: GraphQLString },
    city: { type: GraphQLString },
    memberTypeId: { type: GraphQLString }
  }
});

export const memberChangeDTOType = new GraphQLInputObjectType({
  name: 'memberChangeDTO',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    discount: { type: GraphQLInt },
    monthPostsLimit: { type: GraphQLInt }
  }
});
