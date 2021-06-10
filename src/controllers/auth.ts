import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';

import RequestError from '../util/error';
import User, { AuthToken } from '../models/user';

export const ping = async (req: Request, res: Response, next: NextFunction) => {
    if (req.userId) {
        try {
            const user = await User.findById(req.userId!);
            if (user) {
                return res.status(200).json({
                    message: 'Authenticated'
                });
            } else {
                return next(RequestError.notAuthorized());
            }
        } catch (error) {
            return next(RequestError.notAuthorized());
        }
    } else {
        return next(RequestError.notAuthorized());
    }
}

export const logIn = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: errors.array()[0].msg,
            errors: errors.array() 
        });
    }

    const email = req.body.email;
    const password = req.body.password;

    let user: User;
    try {
        user = await User.findByEmail(email);
    } catch (error) {
        return next(RequestError.accountDoesNotExist());
    }

    if (user) {
        const match = await bcrypt.compare(password, user.hashedPassword);

        if (match) {
            const tokenPayload: AuthToken = { userId: user.id!, activated: user.activated };
            const token = jwt.sign(tokenPayload, 'secret', { expiresIn: '1h' });

            return res.status(200).json({
                userId: user.id,
                token: token,
                activated: user.activated,
                message: 'You are now logged in.'
            });
        } else {
            return next(RequestError.passwordIncorrect());
        }

    } else {
        return next(RequestError.accountDoesNotExist());
    }
}

export const signUp = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: errors.array()[0].msg,
            errors: errors.array() 
        });
    }

    const firstName: string = req.body.firstName.trim();
    const lastName: string = req.body.lastName.trim();
    const username: string = req.body.username.trim();
    const email: string = req.body.email.trim().toLowerCase();
    const password: string = req.body.password;

    try {
        const emailTaken = await User.accountWithEmailExists(email);
        if (emailTaken) {
            return next(RequestError.withMessageAndCode('This email account is taken.', 409));
        }
    } catch (error) {
        return next(RequestError.withMessageAndCode('Something went wrong creating your account.', 500));
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    let activateToken = Math.floor(Math.random() * 1000000).toString();
    while (activateToken.length < 6) {
        activateToken = '0' + activateToken;
    }

    const newUser = new User({
        firstName: firstName,
        lastName: lastName,
        username: username,
        email: email,
        hashedPassword: hashedPassword,
        activated: false,
        activateToken: activateToken
    });

    let accountCreated: boolean;
    try {
        accountCreated = await newUser.create();
    } catch (error) {
        return next(RequestError.withMessageAndCode('Something went wrong creating your account.', 500));
    }

    if (accountCreated) {
        const tokenPayload: AuthToken = { userId: newUser.id!, activated: newUser.activated };
        const token = jwt.sign(tokenPayload, 'secret', { expiresIn: '1h' });

        return res.status(201).json({
            userId: newUser.id,
            token: token,
            activated: newUser.activated,
            message: 'Find our activation email to activate your account.'
        });
    } else {
        return next(RequestError.withMessageAndCode('Something went wrong creating your account.', 500));
    }
}

export const confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: errors.array()[0].msg,
            errors: errors.array() 
        });
    }

    const activateToken = req.body.activateToken;

    let user: User;
    try {
        user = await User.findById(req.userId || '');
    } catch (error) {
        return next(RequestError.withMessageAndCode('Account activation failed.', 500));
    }
    const successfulActivation = await user.activate(activateToken as string);

    if (successfulActivation) {
        const tokenPayload: AuthToken = { userId: user.id!, activated: user.activated };
        const token = jwt.sign(tokenPayload, 'secret', { expiresIn: '1h' });

        return res.status(200).json({
            activated: user.activated,
            token: token,
            message: 'You can now sign into the account.'
        });
    } else {
        return next(RequestError.withMessageAndCode('The activation code was incorrect.', 406));
    }
}

export const requestPasswordReset = (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
        status: 'Reset Email Sent',
        message: 'A password reset email has been sent to the account holder.'
    });
}

export const resetPassword = (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
        status: 'Password Reset',
        message: 'You can now sign into the account.'
    });
}