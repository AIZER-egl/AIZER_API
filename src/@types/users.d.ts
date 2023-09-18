interface User {
    email: string,
    passwordHash: string,
    uuid: string,
    username: string,
    role: 'admin' | 'member' | 'guest',
    lastLogin: Date,
    createdAt: Date,
}

export default User;