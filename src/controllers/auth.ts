import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
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
                return res.status(401).json({
                    message: 'Not Authenticated'
                });
            }
        } catch (error) {
            return res.status(401).json({
                message: 'Not Authenticated'
            });
        }
    } else {
        return res.status(401).json({
            message: 'Not Authenticated'
        });
    }
}

export const logIn = async (req: Request, res: Response, next: NextFunction) => {
    const email = req.body.email;
    const password = req.body.password;

    let user: User;
    try {
        user = await User.findByEmail(email);
    } catch (error) {
        return res.status(404).json({
            message: 'This account does not exist.'
        });
    }

    if (user) {
        const match = await bcrypt.compare(password, user.hashedPassword);

        if (match) {
            const tokenPayload: AuthToken = { userId: user.id!, activated: user.activated };
            const token = jwt.sign(tokenPayload, 'secret', { expiresIn: '1h' });

            return res.status(200).json({
                token: token,
                activated: user.activated,
                message: 'You are now logged in.'
            });
        } else {
            return res.status(401).json({
                message: 'Password is incorrect.'
            });
        }

    } else {
        return res.status(404).json({
            message: 'This account does not exist.'
        });
    }
}

export const signUp = async (req: Request, res: Response, next: NextFunction) => {
    const firstName: string = req.body.firstName;
    const lastName: string = req.body.lastName;
    const email: string = req.body.email.toLowerCase();
    const password: string = req.body.password;

    try {
        const emailTaken = await User.accountWithEmailExists(email);
        if (emailTaken) {
            return res.status(409).json({
                message: 'This email account is taken.'
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: 'Something went wrong creating your account.'
        });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    let activateToken = Math.floor(Math.random() * 1000000).toString();
    while (activateToken.length < 6) {
        activateToken = '0' + activateToken;
    }

    const newUser = new User({
        firstName: firstName,
        lastName: lastName,
        email: email,
        hashedPassword: hashedPassword,
        activated: false,
        activateToken: activateToken
    });

    let accountCreated: boolean;
    try {
        accountCreated = await newUser.create();
    } catch (error) {
        return res.status(500).json({
            message: 'Something went wrong creating your account.'
        });
    }

    if (accountCreated) {
        const tokenPayload: AuthToken = { userId: newUser.id!, activated: newUser.activated };
        const token = jwt.sign(tokenPayload, 'secret', { expiresIn: '1h' });

        return res.status(201).json({
            token: token,
            activated: newUser.activated,
            message: 'Find our activation email to activate your account.'
        });
    } else {
        return res.status(500).json({
            message: 'There was an error creating this account.'
        });
    }
}

export const confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
    const activateToken = req.body.activateToken;

    let user: User;
    try {
        user = await User.findById(req.userId || '');
    } catch (error) {
        return res.status(500).json({
            activated: false,
            message: 'Account activation failed.'
        });
    }
    const successfulActivation = await user.activate(activateToken as string);

    if (successfulActivation) {
        return res.status(200).json({
            activated: user.activated,
            message: 'You can now sign into the account.'
        });
    } else {
        return res.status(406).json({
            activated: user.activated,
            message: 'The activation code was incorrect.'
        });
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