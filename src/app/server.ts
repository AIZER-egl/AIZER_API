import * as dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express from 'express';
import session from 'express-session';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import passport from './passport';
import router from './controllers/router';

const app = express();
app.set('port', process.env.PORT);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // TODO: In production, set this to true and add a proxy
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }
}));
app.use(cookieParser(process.env.COOKIE_SECRET!));
app.use(passport.initialize());
app.use(passport.session());
app.use(morgan('dev'));


app.use('/', router);

export default app;