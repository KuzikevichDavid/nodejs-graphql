import DataLoader = require("dataloader");
import DB from "../../utils/DB/DB";
import { MemberTypeEntity } from "../../utils/DB/entities/DBMemberTypes";
import { PostEntity } from "../../utils/DB/entities/DBPosts";
import { ProfileEntity } from "../../utils/DB/entities/DBProfiles";
import { UserEntity } from "../../utils/DB/entities/DBUsers";

export interface Loader {
  usersById: DataLoader<string, UserEntity, string>;
  postsById: DataLoader<string, PostEntity, string>;
  profilesById: DataLoader<string, ProfileEntity, string>;
  membersById: DataLoader<string, MemberTypeEntity, string>;
  postsByUserId: DataLoader<string, PostEntity[], string>;
  profilesByUserId: DataLoader<string, ProfileEntity, string>;
  subscribedToByUserId: DataLoader<string, UserEntity[], string>;
  toCacheUsers: (entities: UserEntity[]) => UserEntity[];
  toCachePosts: (entities: PostEntity[]) => PostEntity[];
  toCacheProfiles: (entities: ProfileEntity[]) => ProfileEntity[];
  toCache: (
    entities: Array<{ id: string }>,
    loader: DataLoader<string, { id: string }, string>
  ) => Array<{ id: string }>;
}

export const initLoader = (db: DB): Loader => {
  const finder = async (
    keys: readonly string[],
    finder: (args: object) => Promise<Array<any>>,
    args: object
  ) => {
    const results = await finder(args);
    return keys.map((key, i) => results[i] || new Error(`No result for ${key}`));
  };

  const toCache = (
    entities: Array<{ id: string }>,
    loader: DataLoader<string, { id: string }, string>
  ) => {
    entities.forEach((e) => loader.prime(e.id, e));
    return entities;
  };
  // users
  const loadUsers = async (keys: readonly string[]) => {
    console.log('loadUsers');
    const users = await db.users.findMany({ key: 'id', equalsAnyOf: keys });
    const res: Record<string, UserEntity> = {};
    const resArr: Record<string, UserEntity[]> = {};
    users.forEach((u) => {
      res[u.id] = u;
      u.subscribedToUserIds.forEach((uu) => {
        if (!resArr[uu]) resArr[uu] = [];
        resArr[uu].push(u);
      });
    });
    for (const k of Object.keys(resArr)) {
      loader.subscribedToByUserId.prime(k, resArr[k]);
    }
    return keys.map((key) => res[key] || null);
  };
  const toCacheUsers = (users: UserEntity[]) => {
    console.log('toCacheUsers');
    const res: Record<string, UserEntity[]> = {};
    users.forEach((u) => {
      loader.usersById.prime(u.id, u);
      u.subscribedToUserIds.forEach((uu) => {
        if (!res[uu]) res[uu] = [];
        res[uu].push(u);
      });
      if (!res[u.id]) res[u.id] = [];
    });
    for (const k of Object.keys(res)) {
      loader.subscribedToByUserId.prime(k, res[k]);
    }

    return users;
  };
  const userLoader = new DataLoader(loadUsers);
  // subscribedToByUserId
  const loadSubscribedToByUserId = async (keys: readonly string[]) => {
    console.log('loadSubscribedToByUserId');
    const results = await db.users.findMany({
      key: 'subscribedToUserIds',
      inArrayAnyOf: new Array(...keys)
    });
    const res: UserEntity[][] = new Array<UserEntity[]>(keys.length);
    keys.forEach((k, i) => {
      res[i] = [];
      res[i].push(
        ...results.filter((u) => u.subscribedToUserIds.findIndex((x) => x === k) >= 0)
      );
    });
    return res;
  };
  const subscribedToByUserId = new DataLoader(loadSubscribedToByUserId);

  // post
  const loadPosts = async (keys: readonly string[]) => {
    console.log('loadPosts');
    const res: Record<string, PostEntity> = {}
    const resArr: Record<string, PostEntity[]> = {};
    const result = await db.posts.findMany({ key: 'id', equalsAnyOf: keys });
    result.forEach((e) => {
      res[e.id] = e;
      if (!resArr[e.userId]) resArr[e.userId] = []
      resArr[e.userId].push(e)
    });
    for (const k of Object.keys(resArr)) {
      loader.postsByUserId.prime(k, resArr[k]);
    }
    return keys.map((key) => res[key] || null);
  };

  const toCachePosts = (posts: PostEntity[]) => {
    console.log('toCachePosts');
    const res: Record<string, PostEntity[]> = {};
    posts.forEach((e) => {
      loader.postsById.prime(e.id, e);
      if (!res[e.userId]) res[e.userId] = []
      res[e.userId].push(e)
    });
    for (const k of Object.keys(res)) {
      loader.postsByUserId.prime(k, res[k]);
    }
    return posts;
  };
  const postLoader = new DataLoader(loadPosts);

  // postsByUserId
  const loadPostsByUserId = async (keys: readonly string[]) => {
    console.log('loadPostsByUserId');
    const res: Record<string, PostEntity[]> = {};
    const result = await db.posts.findMany({ key: 'userId', equalsAnyOf: keys });
    result.forEach((e) => {
      loader.postsById.prime(e.id, e);
      if (!res[e.userId]) res[e.userId] = []
      res[e.userId].push(e);
    })
    return keys.map((key) => res[key] || [])
  };
  const postsByUserIdLoader = new DataLoader(loadPostsByUserId);

  // profile
  const loadProfile = async (keys: readonly string[]) => {
    console.log('loadProfile');
    const res: Record<string, ProfileEntity> = {}
    const result = await db.profiles.findMany({ key: 'id', equalsAnyOf: keys });
    result.forEach((e) => {
      res[e.id] = e;
      loader.profilesByUserId.prime(e.userId, e)
    });
    return keys.map((key) => res[key] || null);
  };
  const toCacheProfiles = (profiles: ProfileEntity[]) => {
    console.log('toCacheProfiles');
    profiles.forEach((e) => {
      loader.profilesById.prime(e.id, e);
      loader.profilesByUserId.prime(e.userId, e);
    });
    return profiles;
  };
  const profileLoader = new DataLoader(loadProfile);
  // profilesByUserId
  const loadProfilesByUserId = async (keys: readonly string[]) => {
    console.log('loadProfilesByUserId');
    const res: Record<string, ProfileEntity> = {}
    const result = await db.profiles.findMany({ key: 'userId', equalsAnyOf: keys });
    result.forEach((e) => {
      loader.profilesById.prime(e.id, e);
      res[e.userId] = e;
    })
    return keys.map((key) => res[key] || null);
  };
  const profilesByUserIdLoader = new DataLoader(loadProfilesByUserId);

  const loader: Loader = {
    toCache: toCache,
    toCacheUsers: toCacheUsers,
    toCachePosts: toCachePosts,
    toCacheProfiles: toCacheProfiles,
    usersById: userLoader,
    postsById: postLoader,
    profilesById: profileLoader,
    membersById: new DataLoader((keys) =>
      finder(keys, db.memberTypes.findMany, { key: 'id', equalsAnyOf: keys })
    ),
    postsByUserId: postsByUserIdLoader,
    profilesByUserId: profilesByUserIdLoader,
    subscribedToByUserId: subscribedToByUserId
  };

  return loader;
}