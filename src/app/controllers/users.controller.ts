import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import Users from '../model/users';
import jwtAuthentication from '../middlewares/jwtAuthentication';
import User from '../../@types/users';
import users from '../model/users';

const router = Router();

router.get('/', jwtAuthentication, async (req, res) => {
    const user = req.user as User;
    if (user.role !== 'admin') return res.status(403).json({ message: 'You do not have access to that information' });
    const users = await Users.find() as User[];
    users.forEach((userf) => {
        delete userf.passwordHash;
    });
    return res.json(users);
});

router.put('/logup', jwtAuthentication, async (req, res) => {
    const user = req.user as User;
    const { email, password, username, role } = req.body;
    if (user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    if (!email || !password || !username || !role) return res.status(400).json({ message: 'Missing fields' });

    const existsUser = !!(await users.findOne({ email: email.toLowerCase() }));
    if (existsUser) return res.status(400).json({ message: 'User already exists' });
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser = new users({ email, passwordHash, username, role, uuid: uuidv4(), lastLogin: new Date(), createdAt: new Date() });
    await newUser.save();
    res.status(201).json({ user });
});

router.get('/:uuid', jwtAuthentication, async (req, res) => {
    const uuid = req.params.uuid as string;
    const user = req.user as User;

    if (uuid == user.uuid) return res.json({ user });
    if (user.role !== 'admin') return res.status(403).json({ message: 'You do not have access to that information' });
    const userf = await Users.findOne({ uuid }) as User;
    delete userf.passwordHash;
    return res.json({ user: userf });
});

router.delete('/:uuid/delete', jwtAuthentication, async (req, res) => {
    const uuid = req.params.uuid as string;
    const user = req.user as User;

    if (user.role !== 'admin') return res.status(403).json({ message: 'You do not have authorization to do that' });
    if (uuid == user.uuid) return res.status(400).json({ message: 'You cannot delete yourself' });
    const userf = await Users.findOne({ uuid }) as User;
    if (!userf) return res.status(404).json({ message: 'User not found' });
    await Users.deleteOne({ uuid });
    return res.json({ message: 'User deleted' });
});


export default router;
