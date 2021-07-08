import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

import User from '../models/user';
import RequestError from '../util/error';

export const getUser = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.userId;

    return User.findById(userId).then(user => {
        return res.status(200).json({
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email
            }
        });

    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not find this user', 404));
    });
}

export const updateUser = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.body.userId;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const username = req.body.username;

    return User.findById(userId).then(user => {
        if (firstName) { user.firstName = firstName; }
        if (lastName) { user.lastName = lastName; }
        if (username) { user.username = username; }
        user.update();

        return res.status(201).json({
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email
            }
        });

    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not update user.', 500));
    });
}