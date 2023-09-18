import * as dotenv from 'dotenv';
dotenv.config();

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import Users from '../model/users';
import JwtPayload from '../../@types/jwtPayload';
import User from '../../@types/users';

export default function (req: Request, res: Response, next: NextFunction) {
    const token: string = req.header('Authorization') || '';
    
    if (!token) return res.status(401).json({ message: 'No token provided' });
    if (!token.startsWith('Bearer')) return res.status(401).json({ message: 'Invalid token 1' });


    jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET!, async (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Invalid token 2' });
        if (!decoded) return res.status(401).json({ message: 'Invalid token 3'  });

        const { uuid } = decoded as JwtPayload;
        const user = await Users.findOne({ uuid }) as User | null;
        if (!user) return res.status(401).json({ message: 'Invalid token 4' });
        req.user = user;
        next();
    });
}