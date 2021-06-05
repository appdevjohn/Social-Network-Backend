import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth';
import isAuth from '../middleware/auth';

const router = Router();

router.get('/ping', isAuth, authController.ping);

router.put('/login', authController.logIn);

router.post(
    '/signup',
    body('firstName').isLength({ min: 1 }).withMessage('A first name is required.'),
    body('lastName').isLength({ min: 1 }).withMessage('A last name is required.'),
    body('username').isLength({ min: 1 }).withMessage('A username is required.'),
    body('email').isEmail().withMessage('Email address must be valid.'),
    body('password').isLength({ min: 4 }).withMessage('Password must be at least four characters.'),
    authController.signUp
);

router.put('/confirm-email', isAuth, authController.confirmEmail);

router.put('/request-new-password', authController.requestPasswordReset);

router.put('/reset-password', authController.resetPassword);

export default router;