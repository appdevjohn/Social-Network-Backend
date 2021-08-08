import { Router } from 'express';
import { body, param } from 'express-validator';

import * as usersController from '../controllers/users';
import isAuth from '../middleware/auth';
import isActivated from '../middleware/activated';
import upload from '../util/upload';

const router = Router();

router.get(
    '/:userId',
    isAuth,
    isActivated,
    param('userId').isLength({ min: 1 }).withMessage('A userId is required in the parameter.'),
    usersController.getUser
);

router.put(
    '/edit',
    isAuth,
    isActivated,
    body('userId').isLength({ min: 1 }).withMessage('A userId is required.'),
    usersController.updateUser
);

router.put(
    '/edit-image',
    isAuth,
    isActivated,
    upload.single('image'),
    usersController.updateUserImage
);

export default router;