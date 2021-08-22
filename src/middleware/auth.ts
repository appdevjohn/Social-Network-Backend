import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import RequestError from '../util/error';
import { AuthToken } from '../models/user';

const isAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.get('Authorization');
    
    if (!authHeader) {
        req.userId = null;
        throw RequestError.notAuthorized();
    } else {
        const token = authHeader.split(' ')[1];
        let decodedToken: AuthToken;
        try {
            decodedToken = jwt.verify(token, process.env.TOKEN_SECRET as string) as AuthToken;
        } catch (error) {
            req.userId = null;
            throw RequestError.notAuthorized();
        }
        if (!decodedToken) {
            req.userId = null;
            throw RequestError.notAuthorized();
        }

        req.userId = decodedToken.userId;
        req.activated = decodedToken.activated;
        return next();
    }
}

export default isAuth;