import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import passport from '../passport';
import User from '../../@types/users';
import users from '../model/users';
import jwtAuthentication from '../middlewares/jwtAuthentication';

const router = Router();

router.get('/verify', jwtAuthentication, (req, res) => {
    const user = req.user as User;
    user.passwordHash = '';
    res.json({ user });
});

router.get('/failed', (req, res) => {
    res.json({ message: 'Failed to authenticate' });
});

router.post('/login', passport.authenticate('local', { failureRedirect: '/auth/failed' }), (req, res) => {
    const user = req.user as User;
    const token = jwt.sign({ email: user.email, uuid: user.uuid, passwordHash: user.passwordHash }, process.env.JWT_SECRET!, { expiresIn: '1h', algorithm: 'HS512' });
    res.json({ token });
});

router.post('/logup', jwtAuthentication, async (req, res) => {
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
    res.json({ user });
});

export default router;
