import { Router } from 'express';
import * as authController from '../controllers/auth';
import isAuth from '../middleware/auth';

const router = Router();

router.get('/ping', isAuth, authController.ping);

router.post('/login', authController.logIn);

router.post('/signup', authController.signUp);

router.post('/confirm-email', isAuth, authController.confirmEmail);

router.post('/request-new-password', authController.requestPasswordReset);

router.post('/reset-password', authController.resetPassword);

export default router;