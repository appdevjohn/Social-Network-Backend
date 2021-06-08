import { Router } from 'express';
import { body, param } from 'express-validator';

import * as messagesController from '../controllers/messages';
import isAuth from '../middleware/auth';
import isActivated from '../middleware/activated';

const router = Router();

router.get(
    '/validate-recipient/:username',
    isAuth,
    isActivated,
    param('username')
        .isAlphanumeric().withMessage('Username must be alphanumeric')
        .isLength({ min: 1 }).withMessage('A username to validate is required.'),
    messagesController.canMessageUser
);

router.get(
    '/conversations',
    isAuth,
    isActivated,
    messagesController.getConversations
);

router.get(
    '/conversations/:convoId',
    isAuth,
    isActivated,
    param('convoId').isLength({ min: 1 }).withMessage('A conversation ID is required.'),
    messagesController.getConversation
);

router.get(
    '/conversations/:convoId/messages',
    isAuth,
    isActivated,
    param('convoId').isLength({ min: 1 }).withMessage('A conversation ID is required.'),
    messagesController.getMessages
);

router.get(
    '/messages/:messageId',
    isAuth,
    isActivated,
    param('messageId').isLength({ min: 1 }).withMessage('A message ID is required.'),
    messagesController.getMessage
);

router.post(
    '/conversations/new',
    isAuth,
    isActivated,
    body('name').isLength({ min: 1 }).withMessage('A name for this conversation is required.'),
    body('members').isJSON().withMessage('A members array as a JSON string is required, even if it is an empty array.'),
    messagesController.newConversation
);

router.put(
    '/conversations/edit',
    isAuth,
    isActivated,
    body('convoId').isLength({ min: 1 }).withMessage('An ID for the conversation to be edited must be provided.'),
    body('newName').isLength({ min: 1 }).withMessage('A name for this conversation is required.'),
    messagesController.editConversation
);

router.put(
    '/conversations/leave',
    isAuth,
    isActivated,
    body('convoId').isLength({ min: 1 }).withMessage('An ID for the conversation to be deleted must be provided.'),
    messagesController.leaveConversation
);

router.post(
    '/messages/new',
    isAuth,
    isActivated,
    body('convoId').isLength({ min: 1 }).withMessage('A conversation ID for this message must be provided.'),
    body('content').isLength({ min: 1 }).withMessage('Content for this message must be provided'),
    body('type').custom(value => {
        if (value !== 'text' && value !== 'image') {
            throw new Error('The type of message must be provided. It can be either \'text\' or \'image\'.');
        } else {
            return true;
        }
    }),
    messagesController.newMessage
);

router.delete(
    '/messages/delete',
    isAuth,
    isActivated,
    body('messageId').isLength({ min: 1 }).withMessage('A message ID must be provided.'),
    messagesController.deleteMessage
);

export default router;