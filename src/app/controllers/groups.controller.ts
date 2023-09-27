import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { groupsCache, usersCache } from '../cache';
import jwtAuthentication from '../middlewares/jwtAuthentication';

import type { User } from '../../@types/user/users';
import type { Group } from '../../@types/groups/groups';
import type { Log } from '../../@types/groups/log';
import { Groups } from '../model/groups';

const router = Router();

router.get('/', jwtAuthentication, (req, res) => {
    const user = req.user as User;
    const groups = groupsCache.filter((g) => g.members.includes(user.uuid)).map((group) => group) as Group[];
    const externalGroups = groupsCache.filter((g) => !g.members.includes(user.uuid) && g.campus == user.schoolInformation.campus).map((group) => group) as Group[];
    res.json({ groups, externalGroups });
});

router.get('/:uuid', jwtAuthentication, async (req, res) => {
    const user = req.user as User;
    const group = groupsCache.get(req.params.uuid) as Group;
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.members.includes(user.uuid) && user.role != 'admin') return res.status(403).json({ message: 'You are not a member of this group' });
    res.json({ group });
});

router.get('/:uuid/members', jwtAuthentication, async (req, res) => {
    const user = req.user as User;
    const group = groupsCache.get(req.params.uuid) as Group;
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.members.includes(user.uuid) && user.role != 'admin') return res.status(403).json({ message: 'You are not a member of this group' });
    const members = group.members.map((uuid) => usersCache.get(uuid) as User);
    res.json({ members });
});

router.post('/:uuid/members/request', jwtAuthentication, async (req, res) => {
    const user = req.user as User;
    const group = groupsCache.get(req.params.uuid) as Group;
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.members.includes(user.uuid)) return res.status(400).json({ message: 'You are already a member of this group' });
    if (group.membersRequests.includes(user.uuid)) return res.status(400).json({ message: 'You already requested to join this group' });
    group.membersRequests.push(user.uuid);
    const request = { action: 'request', user: user.uuid, timestamp: new Date(), message: 'Requested to join group' } as Log;
    group.logHistory.push(request);
    await Groups.updateOne({ uuid: group.uuid }, { $push: { membersRequests: user.uuid, logHistory: request } });
    res.status(200).json({ user });
});

router.put('/', jwtAuthentication, async (req, res) => {
    const user = req.user as User;
    if (user.role != 'admin') return res.status(403).json({ message: 'You are not an admin' });
    const { group } = req.body;
    if (!group) return res.status(400).json({ message: 'Group data is required' });
    const { name, campus } = group;
    if (!name) return res.status(400).json({ message: 'Group name is required' });
    if (!campus) return res.status(400).json({ message: 'Group campus is required' });
    const uuid = uuidv4();
    const newGroup = new Groups({
        name,
        campus,
        uuid,
        members: [],
        items: [],
        logHistory: [
            { action: 'create', user: user.uuid, timestamp: new Date(), message: 'Group created' } as Log,
        ],
        lastModified: new Date(),
        createdAt: new Date(),
    });
    await newGroup.save();
    groupsCache.ensure(uuid, newGroup as Group);
    res.status(201).json({ message: 'Group created' });
});

export default router;
