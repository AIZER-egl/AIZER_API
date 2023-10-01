import type { Campus } from '../user/campus';
import type { Items } from './items';
import type { User } from '../user/users';
import type { Log } from './log';
import type { FullMember, Member } from './member';

interface Group {
    name: string;
    uuid: string;
    members: Member[];
    membersRequests: string[];
    items: Items[];
    campus: Campus;
    logHistory: Log[];
    lastModified: Date;
    createdAt: Date;
}

interface FullGroup {
    name: string;
    uuid: string;
    members: FullMember[];
    membersRequests: User[];
    items: Items[];
    campus: Campus;
    logHistory: Log[];
    lastModified: Date;
    createdAt: Date;
}

interface GroupReduced {
    name: string;
    uuid: string;
    members: string[];
}

export type { Group, GroupReduced, FullGroup };