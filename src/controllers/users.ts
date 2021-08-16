import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

import User from '../models/user';
import RequestError from '../util/error';
import { getUploadURL } from '../util/upload';

export const getUser = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.userId;

    return User.findById(userId).then(user => {
        return res.status(200).json({
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                profilePicURL: getUploadURL(user.profilePicURL)
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

        return user.update().then(() => {
            return res.status(201).json({
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    username: user.username,
                    email: user.email,
                    profilePicURL: getUploadURL(user.profilePicURL)
                }
            });
        });

    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not update user.', 500));
    });
}

export const updateUserImage = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;

    return User.findById(userId!).then(user => {
        if (user.profilePicURL) {
            const filePath = path.join(__dirname, '..', '..', 'uploads', user.profilePicURL);
            fs.unlink(filePath, () => { console.log('Image Deleted') });
        }

        user.profilePicURL = req.file?.filename;

        return user.update();

    }).then(user => {
        return res.status(200).json({
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                profilePicURL: getUploadURL(user.profilePicURL)
            }
        });
    });
}