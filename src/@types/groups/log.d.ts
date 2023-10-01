import type { User } from '../user/users';

interface Log {
    user: string,
    action: string,
    timestamp: Date,
    message: string,
}

interface FullLog {
    user: User,
    action: string,
    timestamp: Date,
    message: string,
}

export type { Log, FullLog };
