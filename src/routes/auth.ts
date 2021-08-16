import { Router } from 'express';
import { body } from 'express-validator';

import * as authController from '../controllers/auth';
import isAuth from '../middleware/auth';
import isActivated from '../middleware/activated';

const router = Router();

router.get(
    '/ping',
    isAuth,
    isActivated,
    authController.ping
);

router.put(
    '/login',
    body('email').isEmail().withMessage('A valid email address is required.'),
    body('password').isLength({ min: 1 }).withMessage('A password is required.'),
    authController.logIn
);

router.post(
    '/signup',
    body('firstName').isLength({ min: 1 }).withMessage('A first name is required.'),
    body('lastName').isLength({ min: 1 }).withMessage('A last name is required.'),
    body('username')
        .isLength({ min: 1 }).withMessage('A username is required.')
        .isAlphanumeric().withMessage('Username must contain only letters and numbers.'),
    body('email').isEmail().withMessage('Email address must be valid.'),
    body('password').isLength({ min: 4 }).withMessage('Password must be at least four characters.'),
    authController.signUp
);

router.put(
    '/confirm-email',
    isAuth,
    body('activateToken')
        .isLength({ min: 6, max: 6 }).withMessage('The activation code is 6 digits.')
        .isNumeric().withMessage('The activation code should be all numeric.'),
    authController.confirmEmail
);

router.put(
    '/resend-verification-code',
    isAuth,
    authController.resendEmailVerificationCode
);

router.put(
    '/request-new-password',
    authController.requestPasswordReset
);

router.put(
    '/reset-password',
    authController.resetPassword
);

router.delete(
    '/delete-account',
    isAuth,
    authController.deleteAccount
);

export default router;