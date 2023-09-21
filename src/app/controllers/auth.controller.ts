import { Router } from 'express';
import jwt from 'jsonwebtoken';
import passport from '../passport';
import User from '../../@types/users';
import jwtAuthentication from '../middlewares/jwtAuthentication';

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
    res.json({ token });
});

export default router;
