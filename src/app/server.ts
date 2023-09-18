import * as dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express from 'express';
import session from 'express-session';
import morgan from 'morgan';

import passport from './passport';
import router from './controllers/router';

const app = express();
app.set('port', process.env.PORT);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(morgan('dev'));


app.use('/', router);

export default app;