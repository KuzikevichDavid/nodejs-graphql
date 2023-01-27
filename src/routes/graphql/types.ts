import {
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql';
import DB from '../../utils/DB/DB';

export let userType: GraphQLObjectType;
export let postType: GraphQLObjectType;
export let profileType: GraphQLObjectType;
export let memberType: GraphQLObjectType;
export let userCreateDTOType: GraphQLInputObjectType;
export let userChangeDTOType: GraphQLInputObjectType;
export let userSubscriptionDTOType: GraphQLInputObjectType;
export let postCreateDTOType: GraphQLInputObjectType;
export let postChangeDTOType: GraphQLInputObjectType;
export let profileCreateDTOType: GraphQLInputObjectType;
export let profileChangeDTOType: GraphQLInputObjectType;

export const initQLTypes = (db: DB) => {
  userType = new GraphQLObjectType({
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
          return db.profiles.findMany({ key: 'userId', equals: parent.id });
        }
      },
      posts: {
        type: new GraphQLList(postType),
        async resolve(parent, args) {
          return db.posts.findMany({ key: 'userId', equals: parent.id });
        }
      },
      subscribers: {
        type: new GraphQLList(userType),
        async resolve(parent, args) {
          return db.users.findMany({
            key: 'id',
            equalsAnyOf: parent.subscribedToUserIds
          });
        }
      }
    })
  });

  postType = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
      id: { type: GraphQLID },
      title: { type: GraphQLString },
      content: { type: GraphQLString },
      userId: { type: GraphQLID },
      user: {
        type: userType,
        async resolve(parent, args) {
          return db.users.findOne({ key: 'id', equals: parent.userId });
        }
      }
    })
  });

  profileType = new GraphQLObjectType({
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
          //return userLoaderById.load(parent.userId);
          return db.users.findOne({ key: 'id', equals: parent.userId });
        }
      },
      memberType: {
        type: memberType,
        async resolve(parent, args) {
          return db.memberTypes.findOne({ key: 'id', equals: parent.memberTypeId });
        }
      }
    })
  });

  memberType = new GraphQLObjectType({
    name: 'MemberType',
    fields: () => ({
      id: { type: GraphQLString },
      discount: { type: GraphQLInt },
      monthPostsLimit: { type: GraphQLInt }
    })
  });

  userCreateDTOType = new GraphQLInputObjectType({
    name: 'userCreateDTO',
    fields: {
      firstName: { type: new GraphQLNonNull(GraphQLString) },
      lastName: { type: new GraphQLNonNull(GraphQLString) },
      email: { type: new GraphQLNonNull(GraphQLString) }
    }
  });

  userChangeDTOType = new GraphQLInputObjectType({
    name: 'userChangeDTO',
    fields: {
      id: { type: new GraphQLNonNull(GraphQLID) },
      firstName: { type: GraphQLString },
      lastName: { type: GraphQLString },
      email: { type: GraphQLString }
    }
  });

  userSubscriptionDTOType = new GraphQLInputObjectType({
    name: 'userSubscriprionDTO',
    fields: {
      id: { type: new GraphQLNonNull(GraphQLID) },
      userId: { type: new GraphQLNonNull(GraphQLID) }
    }
  });

  postCreateDTOType = new GraphQLInputObjectType({
    name: 'postCreateDTO',
    fields: {
      title: { type: new GraphQLNonNull(GraphQLString) },
      content: { type: new GraphQLNonNull(GraphQLString) },
      userId: { type: new GraphQLNonNull(GraphQLID) }
    }
  });

  postChangeDTOType = new GraphQLInputObjectType({
    name: 'postChangeDTO',
    fields: {
      id: { type: new GraphQLNonNull(GraphQLID) },
      title: { type: GraphQLString },
      content: { type: GraphQLString }
    }
  });

  profileCreateDTOType = new GraphQLInputObjectType({
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

  profileChangeDTOType = new GraphQLInputObjectType({
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
};
