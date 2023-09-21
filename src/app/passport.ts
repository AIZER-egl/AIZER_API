import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import users from './model/users';
import User from '../@types/users';

passport.use(
    new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
    }, async (email, password, done) => {
        email = email.toLowerCase();
        const user = await users.findOne({ email }) as User | null;
        if (!user) {
            return done (null, false, { message: 'Unknown user' });
        }
        if (!bcrypt.compareSync(password, user.passwordHash || '')) {
            return done(null, false, { message: 'Invalid password' });
        }
        await users.updateOne({ email }, { lastLogin: new Date() });
        return done(null, user);
    })
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj: User | undefined, done) => done(null, obj));

export default passport;
