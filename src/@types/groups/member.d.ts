import { User } from '../user/users';
import type { Access } from './access';
import type { Roles } from './roles';

interface Member {
    user: string,
    access: Access[],
    role: Roles,
    owner: boolean,
}

interface FullMember {
    user: User,
    access: Access[],
    role: Roles,
    owner: boolean,
}

export { Member, FullMember };