import { Router } from 'express';
import jwtAuthentication from '../middlewares/jwtAuthentication';
import { usersCache, groupsCache } from '../cache';

import { Users } from '../model/users';
import type { User } from '../../@types/user/users';
import type { Group } from '../../@types/groups/groups';

const router = Router();

router.get('/', jwtAuthentication, async (req, res) => {
    const user = req.user as User;
    delete user.passwordHash;

    const groups = groupsCache.filter((g) => g.members.includes(user.uuid)).map((group) => group) as Group[];
    res.json({ user, groups });
});


router.get('/:uuid', jwtAuthentication, async (req, res) => {
    const userf = usersCache.get(req.params.uuid) || await Users.findOne({ uuid: req.params.uuid }) as User;
    if (!userf) return res.status(404).json({ message: 'User not found' });
    delete userf.passwordHash;

    const groups = groupsCache.filter((g) => g.members.includes(userf.uuid)).map((group) => group) as Group[];
    res.json({ user: userf, groups });
});

export default router;
