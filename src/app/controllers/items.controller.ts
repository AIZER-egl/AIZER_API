import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { groupsCache } from '../cache';
import { Groups } from '../model/groups';
import jwtAuthentication from '../middlewares/jwtAuthentication';
import type { User } from '../../@types/user/users';
import { Shipments } from '../../@types/groups/shipments';
import { Items } from '../../@types/groups/items';

const router = Router();

router.get('/:uuid/items/', jwtAuthentication, (req, res) => {
    const group = groupsCache.get(req.params.uuid);
    const user = req.user as User;
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.some((mf) => mf.user == user.uuid) && user.role != 'admin') return res.status(403).json({ error: 'You are not a member of this group' });

    
    const shipments = group.shipments.map((shipment) => shipment.items.map((item) => ({ ...item, item: group.items.find((i) => i.uuid == item.item) })));
    const items = group.items.filter((i) => i.active);
    return res.send({ items, shipments });
});

router.get('/:uuid/items/:item', jwtAuthentication, (req, res) => {
    const group = groupsCache.get(req.params.uuid);
    const user = req.user as User;
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.some((mf) => mf.user == user.uuid) && user.role != 'admin') return res.status(403).json({ error: 'You are not a member of this group' });

    const item = group.items.find((i) => i.uuid == req.params.item);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (!item.active) return res.status(404).json({ error: 'Item has been deleted' });
    return res.send({ item });
});

router.delete('/:uuid/items/:item', jwtAuthentication, async (req, res) => {
    const group = groupsCache.get(req.params.uuid);
    const user = req.user as User;

    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.some((mf) => mf.user == user.uuid) && user.role != 'admin') return res.status(403).json({ error: 'You are not a member of this group' });

    const item = group.items.find((i) => i.uuid == req.params.item);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    item.active = false;
    item.lastModified = new Date();
    group.items = group.items.map((i) => (i.uuid == item.uuid ? item : i));
    groupsCache.set(req.params.uuid, group);
    await Groups.updateOne({ uuid: req.params.uuid }, { $set: { items: group.items } });
    return res.send({ item });
});

router.put('/:uuid/items', jwtAuthentication, async (req, res) => {
    const group = groupsCache.get(req.params.uuid);
    const user = req.user as User;

    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.some((mf) => mf.user == user.uuid) && user.role != 'admin') return res.status(403).json({ error: 'You are not a member of this group' });

    const { name, price, description } = req.body;
    if (!name || !price || !description) return res.status(400).json({ error: 'Missing required fields' });

    const uuid = uuidv4();
    const item = { name, price, description, uuid, amount: 0, createdAt: new Date(), lastModified: new Date(), active: true } as Items;
    group.items.push(item);
    groupsCache.set(req.params.uuid, group);
    await Groups.updateOne({ uuid: req.params.uuid }, { $push: { items: item } });
    return res.send({ item });
});

router.patch('/:uuid/items/:item', jwtAuthentication, async (req, res) => {
    const group = groupsCache.get(req.params.uuid);
    const user = req.user as User;
    const item = group?.items.find((i) => i.uuid == req.params.item);
    console.log(req.body);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.some((mf) => mf.user == user.uuid) && user.role != 'admin') return res.status(403).json({ error: 'You are not a member of this group' });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (!item.active) return res.status(400).json({ error: 'Item has been deleted' });

    const { name, price, description, amount } = req.body;
    if (!name && !price && !description && !amount) return res.status(400).json({ error: 'Missing required fields' });

    if (name) item.name = name;
    if (price) item.price = price;
    if (description) item.description = description;
    if (amount) item.amount = amount;
    item.lastModified = new Date();
    group.items = group.items.map((i) => (i.uuid == item.uuid ? item : i));
    groupsCache.set(req.params.uuid, group);
    await Groups.updateOne({ uuid: req.params.uuid }, { $set: { items: group.items } });
    return res.send({ item });
});

router.get('/:uuid/items/shipments', jwtAuthentication, async (req, res) => {
    const group = groupsCache.get(req.params.uuid);
    const user = req.user as User;
    const member = group?.members.find((mf) => mf.user == user.uuid);

    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!member && user.role != 'admin') return res.status(403).json({ error: 'You are not a member of this group' });

    const shipments = group.shipments.map((shipment) => shipment.items.map((item) => ({ ...item, item: group.items.find((i) => i.uuid == item.item) })));
    return res.send({ shipments });
});

router.put('/:uuid/items/shipments', jwtAuthentication, async (req, res) => {
    const group = groupsCache.get(req.params.uuid);
    const user = req.user as User;
    const member = group?.members.find((mf) => mf.user == user.uuid);

    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (member?.role != 'admin' && user.role != 'admin') return res.status(403).json({ error: 'You are not an admin of this group' });

    const { items, store, delieveryFee, delieveryStatus, delieveryReference } = req.body;
    const uuid = uuidv4();
    if (!items.length || !store || typeof delieveryFee == 'undefined' || !delieveryStatus) return res.status(400).json({ error: 'Missing required fields' });
    const shipment = { items, store, delieveryFee, delieveryStatus, delieveryReference, uuid, createdAt: new Date(), lastModified: new Date() } as Shipments;
    if (shipment.items.map((i) => i.item && i.quantity).some((i) => !i)) return res.status(400).json({ error: 'Missing required fields' });
    group.shipments.push(shipment);

    for (const item of shipment.items) {
        group.items = group.items.map((i) => {
            if (i.uuid == item.item) i.amount += item.quantity;
            return i;
        });
    }

    groupsCache.set(req.params.uuid, group);
    await Groups.updateOne({ uuid: req.params.uuid }, { $push: { shipments: shipment }, $set: { items: group.items } });
    return res.send({ shipment });
});

router.get('/:uuid/items/shipments/:shipment', jwtAuthentication, (req, res) => {
    const group = groupsCache.get(req.params.uuid);
    const user = req.user as User;
    const member = group?.members.find((mf) => mf.user == user.uuid);

    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!member && user.role != 'admin') return res.status(403).json({ error: 'You are not a member of this group' });

    const shipment = group.shipments.find((s) => s.uuid == req.params.shipment);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    return res.send({ shipment });
});

router.patch('/:uuid/items/shipments/:shipment', jwtAuthentication, async (req, res) => {
    const group = groupsCache.get(req.params.uuid);
    const user = req.user as User;
    const member = group?.members.find((mf) => mf.user == user.uuid);

    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (member?.role != 'admin' || user.role != 'admin') return res.status(403).json({ error: 'You are not an admin of this group' });

    const { items, store, delieveryFee, delieveryStatus, delieveryReference } = req.body;
    const shipment = group.shipments.find((s) => s.uuid == req.params.shipment);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    if (!items.length && !store && typeof delieveryFee == 'undefined' && !delieveryStatus) return res.status(400).json({ error: 'Missing required fields' });
    
    if (items) shipment.items = items;
    if (store) shipment.store = store;
    if (typeof delieveryFee != 'undefined') shipment.delieveryFee = delieveryFee;
    if (delieveryStatus) shipment.delieveryStatus = delieveryStatus;
    if (delieveryReference) shipment.delieveryReference = delieveryReference;
    shipment.lastModified = new Date();
    group.shipments = group.shipments.map((s) => (s.uuid == shipment.uuid ? shipment : s));
    groupsCache.set(req.params.uuid, group);
    await Groups.updateOne({ uuid: req.params.uuid }, { $set: { shipments: group.shipments } });
    return res.send({ shipment });
});

export default router;
