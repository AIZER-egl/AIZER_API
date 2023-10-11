// TODO: Check access and permissions

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { groupsCache, usersCache } from '../cache';
import { Groups } from '../model/groups';
import jwtAuthentication from '../middlewares/jwtAuthentication';
import ItemsController from './items.controller';

import type { User } from '../../@types/user/users';
import type { FullGroup, Group } from '../../@types/groups/groups';
import type { Log, FullLog } from '../../@types/groups/log';
import type { Member, FullMember } from '../../@types/groups/member';

const router = Router();

router.get('/', jwtAuthentication, (req, res) => {
    const user = req.user as User;
    const groups = groupsCache.filter((g) => g.members.some((memberf) => memberf.user == user.uuid)).map((group) => group) as Group[];
    const externalGroups = groupsCache.filter((g) => !g.members.some((memberf) => memberf.user == user.uuid)).map((group) => group) as Group[];
    res.json({ groups, externalGroups });
});

router.get('/:uuid', jwtAuthentication, async (req, res) => {
    const user = req.user as User;
    const group = groupsCache.get(req.params.uuid) as Group;
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.members.some((memberf) => memberf.user == user.uuid) && user.role != 'admin') return res.status(403).json({ message: 'You are not a member of this group' });
    res.json({ group });
});

router.get('/:uuid/full', jwtAuthentication, async (req, res) => {
    const user = req.user as User;
    const group = groupsCache.get(req.params.uuid) as Group;
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.members.some((memberf) => memberf.user == user.uuid) && user.role != 'admin') return res.status(403).json({ message: 'You are not a member of this group' });

    const members: FullMember[] = group.members.map((member) => {
        return { ...member, user: usersCache.get(member.user) as User };
    });
    members.map((memberf) => memberf.user.passwordHash = '');
    const membersRequests: User[] = group.membersRequests.map((member) => {
        return usersCache.get(member) as User;
    });
    membersRequests.map((memberf) => memberf.passwordHash = '');
    group.items = group.items.filter((item) => item.active);
    const logHistory: FullLog[] = group.logHistory.map((log) => {
        return { ...log, actionTo: usersCache.get(log.actionTo!) || null, user: usersCache.get(log.user) as User };
    });

    res.json({ group: { ...group, members, membersRequests, logHistory } });
});

router.get('/:uuid/members', jwtAuthentication, async (req, res) => {
    const user = req.user as User;
    const group = groupsCache.get(req.params.uuid);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.members.some((memberf) => memberf.user == user.uuid) && user.role != 'admin') return res.status(403).json({ message: 'You are not a member of this group' });

    const members = group.members.map((member) => { return { ...member, user: usersCache.get(member.user) as User }; }) as FullGroup['members'];
    members.map((memberf) => memberf.user.passwordHash = '');
    res.json({ members });
});

router.get('/:uuid/members/:uuidf', jwtAuthentication, async (req, res) => {
    const user = req.user as User;
    const group = groupsCache.get(req.params.uuid);
    const member = group?.members.find((memberf) => memberf.user == user.uuid);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!member && user.role != 'admin') return res.status(403).json({ message: 'You are not a member of this group' });

    const userf = usersCache.get(req.params.uuidf);
    const memberf = group.members.find((memberf) => memberf.user == userf?.uuid);
    if (!userf) return res.status(404).json({ message: 'User not found' });
    if (!memberf) return res.status(404).json({ message: 'User is not a member of this group' });
    if (user.uuid != member?.user && member?.role != 'admin' && user.role != 'admin') return res.status(403).json({ message: 'You cannot view this user' });
    userf.passwordHash = '';
    res.json({ member: { ...memberf, user: userf } });
});

router.patch('/:uuid/members/:uuidf', jwtAuthentication, async (req, res) => {
    const user = req.user as User;
    const { role, access } = req.body;
    const group = groupsCache.get(req.params.uuid);
    const member = group?.members.find((memberf) => memberf.user == user.uuid) as Member;

    if (!role || !access) return res.status(400).json({ message: 'Role and access are required' });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!member) return res.status(403).json({ message: 'You are not a member of this group' });
    if (member.role != 'admin' && user.role != 'admin') return res.status(403).json({ message: 'You are not an admin' });

    const userf = usersCache.get(req.params.uuidf);
    if (!userf) return res.status(404).json({ message: 'User not found' });
    const memberf = group.members.find((memberf) => memberf.user == userf.uuid) as Member;
    if (!memberf) return res.status(404).json({ message: 'User is not a member of this group' });
    if (member.role == 'admin' && memberf.role == 'admin' && !member.owner) return res.status(403).json({ message: 'You cannot change this user' });
    const log = { action: 'update', user: user.uuid, actionTo: userf.uuid, timestamp: new Date(), message: 'Updated member' } as Log;
    const newMember = {
        access,
        role,
        user: userf.uuid,
        owner: memberf.owner,
    } as Member;
    memberf.role = role;
    memberf.access = access;
    group.lastModified = new Date();
    group.logHistory.push(log);
    group.members = group.members.filter((memberf) => memberf.user != userf.uuid);
    group.members.push(newMember);
    groupsCache.set(group.uuid, group);

    await Groups.updateOne(
        { uuid: group.uuid, 'members.user': memberf.user },
        { 
            $push: { logHistory: log },
            $set: {
                'members.$.access': access,
                'members.$.role': role,
                lastModified: new Date(),
            }
        }
    );
    res.status(200).json({ message: 'Member updated' });
});

router.post('/:uuid/members/request', jwtAuthentication, async (req, res) => {
    const user = req.user as User;
    const group = groupsCache.get(req.params.uuid) as Group;
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.members.some((memberf) => memberf.user == user.uuid)) return res.status(400).json({ message: 'You are already a member of this group' });
    if (group.membersRequests.includes(user.uuid)) return res.status(409).json({ message: 'You already requested to join this group' });
    group.membersRequests.push(user.uuid);
    const request = { action: 'request', actionTo: null, user: user.uuid, timestamp: new Date(), message: 'Requested to join group' } as Log;
    group.logHistory.push(request);
    await Groups.updateOne({ uuid: group.uuid }, { $push: { membersRequests: user.uuid, logHistory: request } });
    user.passwordHash = '';
    res.status(200).json({ user });
});

router.post('/:uuid/members/accept', jwtAuthentication, async (req, res) => {
    const user = req.user as User;
    const group = groupsCache.get(req.params.uuid) as Group;
    const member = group?.members.find((memberf) => memberf.user == user.uuid);

    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (user.role != 'admin' && member?.role != 'admin') return res.status(403).json({ message: 'You are not an admin' });
    
    // Accept all users
    const membersRequests = group.membersRequests;
    group.membersRequests = [];
    membersRequests.forEach((userf) => {
        group.members.push({ user: userf, access: [], role: 'member', owner: false } as Member);
    });
    const log = { action: 'accept', actionTo: null, user: user.uuid, timestamp: new Date(), message: 'Accepted all users to group' } as Log;
    group.logHistory.push(log);
    await Groups.updateOne({ uuid: group.uuid }, { $push: { members: { $each: membersRequests.map((userf) => { return { user: userf, access: [], role: 'member', owner: false } as Member; }) }, logHistory: log }, $set: { membersRequests: [] } });
    groupsCache.set(group.uuid, group);
    res.status(200).json({ message: 'Users accepted' });
});

router.post('/:uuid/members/reject', jwtAuthentication, async (req, res) => {
    const user = req.user as User;
    const group = groupsCache.get(req.params.uuid) as Group;
    const member = group?.members.find((memberf) => memberf.user == user.uuid);

    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (user.role != 'admin' && member?.role != 'admin') return res.status(403).json({ message: 'You are not an admin' });
    
    // Reject all users
    group.membersRequests = [];
    const log = { action: 'reject', actionTo: null, user: user.uuid, timestamp: new Date(), message: 'Rejected all users to group' } as Log;
    group.logHistory.push(log);
    await Groups.updateOne({ uuid: group.uuid }, { $push: { logHistory: log }, $set: { membersRequests: [] } });
    groupsCache.set(group.uuid, group);
    res.status(200).json({ message: 'Users rejected' });
});

router.post('/:uuid/members/reject/:uuidf', jwtAuthentication, async (req, res) => {
    const user = req.user as User;
    const userf = usersCache.get(req.params.uuidf) as User;
    const group = groupsCache.get(req.params.uuid) as Group;
    const member = group?.members.find((memberf) => memberf.user == user.uuid);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!userf) return res.status(404).json({ message: 'User not found' });
    if (!member && user.role != 'admin') return res.status(403).json({ message: 'You are not a member of this group' });
    if (user.role != 'admin' && member?.role != 'admin') return res.status(403).json({ message: 'You are not an admin' });
    if (!group.membersRequests.includes(userf.uuid)) return res.status(400).json({ message: 'User did not request to join this group' });

    group.membersRequests = group.membersRequests.filter((memberf) => memberf != userf.uuid);
    const log = { action: 'reject', actionTo: userf.uuid, user: user.uuid, timestamp: new Date(), message: 'Rejected user to group' } as Log;
    group.logHistory.push(log);
    await Groups.updateOne({ uuid: group.uuid }, { $push: { logHistory: log }, $pull: { membersRequests: userf.uuid } });
    groupsCache.set(group.uuid, group);
    res.status(200).json({ message: 'User rejected' });
});

router.post('/:uuid/members/accept/:uuidf', jwtAuthentication, async (req, res) => {
    const user = req.user as User;
    const userf = usersCache.get(req.params.uuidf) as User;
    const group = groupsCache.get(req.params.uuid) as Group;
    const member = group?.members.find((memberf) => memberf.user == user.uuid);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!userf) return res.status(404).json({ message: 'User not found' });
    if (!member && user.role != 'admin') return res.status(403).json({ message: 'You are not a member of this group' });
    if (user.role != 'admin' && member?.role != 'admin') return res.status(403).json({ message: 'You are not an admin' });
    if (!group.membersRequests.includes(userf.uuid)) return res.status(400).json({ message: 'User did not request to join this group' });

    group.membersRequests = group.membersRequests.filter((memberf) => memberf != userf.uuid);
    group.members.push({ user: userf.uuid, access: [], role: 'member', owner: false } as Member);
    const log = { action: 'accept', actionTo: userf.uuid, user: user.uuid, timestamp: new Date(), message: 'Accepted user to group' } as Log;
    group.logHistory.push(log);
    await Groups.updateOne({ uuid: group.uuid }, { $push: { members: { user: userf.uuid, access: [], role: { role: 'member' }, owner: false }, logHistory: log }, $pull: { membersRequests: userf.uuid } });
    groupsCache.set(group.uuid, group);
    res.status(200).json({ message: 'User accepted' });
});

router.put('/', jwtAuthentication, async (req, res) => {
    console.log('PUT /groups', req.body);
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
        shipments: [],
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

router.use('/', ItemsController);

export default router;
