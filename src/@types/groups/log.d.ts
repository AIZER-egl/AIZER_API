import type { User } from '../user/users';

interface Log {
    user: string,
    actionTo: string | null,
    action: string,
    timestamp: Date,
    message: string,
}

interface FullLog {
    user: User,
    actionTo: User | null,
    action: string,
    timestamp: Date,
    message: string,
}

export type { Log, FullLog };
