import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { AuthToken } from '../models/user';

const isAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.get('Authorization');
    
    if (!authHeader) {
        req.userId = null;
        return next();
    } else {
        const token = authHeader.split(' ')[1];
        let decodedToken: AuthToken;
        try {
            decodedToken = jwt.verify(token, 'secret') as AuthToken;
        } catch (error) {
            req.userId = null;
            return next();
        }
        if (!decodedToken) {
            req.userId = null;
            return next();
        }

        req.userId = decodedToken.userId;
        req.activated = decodedToken.activated;
        return next();
    }
}

export default isAuth;