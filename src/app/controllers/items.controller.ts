import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { groupsCache } from '../cache';
import jwtAuthentication from '../middlewares/jwtAuthentication';
import type { User } from '../../@types/user/users';

const router = Router();

router.get('/:uuid/items/', jwtAuthentication, (req, res) => {
    const group = groupsCache.get(req.params.uuid);
    const user = req.user as User;
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.some((mf) => mf.user == user.uuid) && user.role != 'admin') return res.status(403).json({ error: 'You are not a member of this group' });

    const shipments = group.shipments.map((shipment) => shipment.items.map((item) => ({ ...item, item: group.items.find((i) => i.uuid == item.item) })));
    return res.send({ items: group.items, shipments });
});

router.get('/:uuid/items/:item', jwtAuthentication, (req, res) => {
    const group = groupsCache.get(req.params.uuid);
    const user = req.user as User;
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.some((mf) => mf.user == user.uuid) && user.role != 'admin') return res.status(403).json({ error: 'You are not a member of this group' });

    const item = group.items.find((i) => i.uuid == req.params.item);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    return res.send({ item });
});

router.put('/:uuid/items', jwtAuthentication, (req, res) => {
    const group = groupsCache.get(req.params.uuid);
    const user = req.user as User;

    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.some((mf) => mf.user == user.uuid) && user.role != 'admin') return res.status(403).json({ error: 'You are not a member of this group' });

    const { name, price, description } = req.body.item;
    if (!name || !price || !description) return res.status(400).json({ error: 'Missing required fields' });

    const uuid = uuidv4();
    const item = { name, price, description, uuid, amount: 0, createdAt: new Date(), lastModified: new Date() };
    group.items.push(item);
    groupsCache.set(req.params.uuid, group);
});

export default router;
