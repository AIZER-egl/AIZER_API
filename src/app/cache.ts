import { Cache } from '../packages/cache';
import type { User } from '../@types/user/users';
import type { Group } from '../@types/groups/groups';

const usersCache = new Cache<string, User>();
const groupsCache = new Cache<string, Group>();

export { usersCache, groupsCache };