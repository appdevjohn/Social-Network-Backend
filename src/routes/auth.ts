import { Router } from 'express';
import * as authController from '../controllers/auth';
import isAuth from '../middleware/auth';

const router = Router();

router.get('/ping', isAuth, authController.ping);

router.put('/login', authController.logIn);

router.post('/signup', authController.signUp);

router.put('/confirm-email', isAuth, authController.confirmEmail);

router.put('/request-new-password', authController.requestPasswordReset);

router.put('/reset-password', authController.resetPassword);

export default router;