import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { usersCache } from '../cache';
import { Users } from '../model/users';
import passport from '../passport';
import jwtAuthentication from '../middlewares/jwtAuthentication';

import type { User } from '../../@types/user/users';

const router = Router();

router.get('/verify', jwtAuthentication, (req, res) => {
    const user = req.user as User;
    delete user.passwordHash;
    res.json({ user });
});

router.get('/failed', (req, res) => {
    res.json({ message: 'Failed to authenticate' });
});

router.post('/login', passport.authenticate('local', { failureRedirect: '/auth/failed' }), (req, res) => {
    const user = req.user as User;
    const token = jwt.sign({ email: user.email, uuid: user.uuid, passwordHash: user.passwordHash }, process.env.JWT_SECRET!, { expiresIn: '1h', algorithm: 'HS512' });
    usersCache.ensure(user.uuid, user);
    res.json({ token });
});

router.post('/logup', async (req, res) => {
    const user = req.body as User;
    if (!user) return res.status(400).json({ message: 'No user provided' });
    if (!user.email) return res.status(400).json({ message: 'No email provided' });
    if (!user.passwordHash) return res.status(400).json({ message: 'No password provided' });
    if (!user.username) return res.status(400).json({ message: 'No username provided' });
    if (!user.schoolInformation?.campus) return res.status(400).json({ message: 'No campus provided' });
    if (!user.schoolInformation?.graduationYear) return res.status(400).json({ message: 'No graduation year provided' });

    const userf = !!(await Users.findOne({ email: user.email.toLowerCase()}));
    if (userf) return res.status(400).json({ message: 'User already exists' });

    const uuid = uuidv4();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(user.passwordHash, salt);
    const newUser = new Users({
        email: user.email.toLowerCase(),
        passwordHash,
        username: user.username,
        uuid,
        schoolInformation: {
            campus: user.schoolInformation.campus,
            grade: user.schoolInformation.graduationYear,
        },
        groups: [],
        lastLogin: new Date(),
        role: 'member' });
    await newUser.save();
    usersCache.ensure(uuid, newUser as User);
    return res.status(201).json({ message: 'User created' });
});

export default router;
