import { Request, Response, NextFunction } from 'express';

import RequestError from '../util/error';

const isActivated = (req: Request, res: Response, next: NextFunction) => {
    if (req.activated) {
        return next();
    } else {
        throw RequestError.notAuthorized();
    }
}

export default isActivated;