import app from './src/app/server';
import mongoose from './src/app/mongoose';
import { Users } from './src/app/model/users';
import { Groups } from './src/app/model/groups';
import { usersCache, groupsCache } from './src/app/cache';
import { Group } from './src/@types/groups/groups';
import { User } from './src/@types/user/users';

process.stdout.write('Starting server... ');
app.listen(app.get('port'), async () => {
    process.stdout.write(`\rServer listening on port ${app.get('port')}\n`);
    await mongoose();

    process.stdout.write('Loading users... ');
    const users = await Users.find().lean() as User[];
    users.forEach((user) => usersCache.ensure(user.uuid, user));
    process.stdout.write(`\rUsers have been loaded to cache! Cache size: ${usersCache.size}\n`);

    process.stdout.write('Loading groups... ');
    const groups = await Groups.find().lean() as Group[];
    groups.forEach((group) => groupsCache.ensure(group.uuid, group));
    process.stdout.write(`\rGroups have been loaded to cache! Cache size: ${groupsCache.size}\n`);
});

process.stdin.on('data', (data) => {
    if (data.toString() == 'rs\n') return;
    
    if (data.toString() == 'exit\n') {
        process.stdout.write('\nStopping server... ');
        process.exit(0);
    }

    try {
        const result = eval(data.toString());
        console.log(result);
    } catch (e) {
        console.log(e);
    }
});

process.on('rejectionHandled', (error) => {
    console.warn(error);
});

process.on('uncaughtException', (error) => {
    console.error(error);
});

process.on('unhandledRejection', (error) => {
    console.warn(error);
});