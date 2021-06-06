import { Router } from 'express';
import { body, param } from 'express-validator';

import * as groupsController from '../controllers/groups';
import isAuth from '../middleware/auth';
import isActivated from '../middleware/activated';

const router = Router();

router.get(
    '/validate/:groupName',
    isAuth,
    isActivated,
    param('groupName').isLength({ min: 1 }).withMessage('A group name is required to validate it.'),
    groupsController.validateGroupName
);

router.get(
    '/',
    isAuth,
    isActivated,
    groupsController.getGroups
);

router.get(
    '/:groupId',
    isAuth,
    isActivated,
    param('groupId').isLength({ min: 1 }).withMessage('A group ID is required.'),
    groupsController.getGroup
);

router.post(
    '/new',
    isAuth,
    isActivated,
    body('name').isLength({ min: 1 }).withMessage('A group name is required.'),
    groupsController.newGroup
);

router.put(
    '/edit',
    isAuth,
    isActivated,
    body('id').isLength({ min: 1 }).withMessage('A group ID is required.'),
    body('name').isLength({ min: 1 }).withMessage('A group name is required.'),
    groupsController.editGroup
);

router.delete(
    '/delete',
    isAuth,
    isActivated,
    body('id').isLength({ min: 1 }).withMessage('A group ID is required.'),
    groupsController.deleteGroup
);

export default router;