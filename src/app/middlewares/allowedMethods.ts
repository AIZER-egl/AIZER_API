import { NextFunction, Request, Response } from 'express';

const allowedMethods = [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
];

export default async (req: Request, res: Response, next: NextFunction) => {
    if (!allowedMethods.includes(req.method)) {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    next();
};