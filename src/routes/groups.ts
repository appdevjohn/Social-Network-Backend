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
    '/search/:groupName',
    isAuth,
    isActivated,
    param('groupName').isLength({ min: 3 }).withMessage('A search query with at least three characters is required.'),
    groupsController.getGroupWithNameLike
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
    body('description').isLength({ min: 1 }).withMessage('A group description is required.'),
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

router.post(
    '/:groupId/add-user',
    isAuth,
    isActivated,
    param('groupId').isLength({ min: 1 }).withMessage('A group ID is required.'),
    body('userId').isLength({ min: 1 }).withMessage('A user ID is required.'),
    body('approved').isBoolean().withMessage('Missing a value for whether or not the user is approved to join the group.'),
    groupsController.addUserToGroup
);

router.post(
    '/:groupId/remove-user',
    isAuth,
    isActivated,
    param('groupId').isLength({ min: 1 }).withMessage('A group ID is required.'),
    body('userId').isLength({ min: 1 }).withMessage('A user ID is required.'),
    groupsController.removeUserFromGroup
)

router.put(
    '/:groupId/requests/:userId/approve',
    isAuth,
    isActivated,
    param('groupId').isLength({ min: 1 }).withMessage('A group ID is required.'),
    param('userId').isLength({ min: 1 }).withMessage('A user ID is required.'),
    groupsController.approveUserJoinRequest
);

router.put(
    '/:groupId/set-admin',
    isAuth,
    isActivated,
    param('groupId').isLength({ min: 1 }).withMessage('A group ID is required.'),
    body('userId').isLength({ min: 1 }).withMessage('A user ID is required.'),
    body('admin').isBoolean().withMessage('A boolean value for \'admin\' is required.'),
    groupsController.setAdminStatusOfMember
);

router.get(
    '/:groupId/requests',
    isAuth,
    isActivated,
    param('groupId').isLength({ min: 1 }).withMessage('A group ID is required.'),
    groupsController.getGroupJoinRequests
);

router.get(
    '/:groupId/admins',
    isAuth,
    isActivated,
    param('groupId').isLength({ min: 1 }).withMessage('A group ID is required.'),
    groupsController.getAdminsInGroup
);

router.get(
    '/:groupId/members',
    isAuth,
    isActivated,
    param('groupId').isLength({ min: 1 }).withMessage('A group ID is required.'),
    groupsController.getMembersInGroup
);

export default router;