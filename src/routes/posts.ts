import { Router } from 'express';
import { body, param, query } from 'express-validator';

import * as postsController from '../controllers/posts';
import * as messagesController from '../controllers/messages';
import isAuth from '../middleware/auth';
import isActivated from '../middleware/activated';
import upload from '../util/upload';

const router = Router();

router.get(
    '/',
    isAuth,
    isActivated,
    query('groupId').isLength({ min: 1 }).withMessage('A group ID is required to get posts.'),
    postsController.getPosts
);

router.get(
    '/:postId',
    isAuth,
    isActivated,
    param('postId').isLength({ min: 1 }).withMessage('A post ID is required to get a post.'),
    postsController.getPost
);

router.post(
    '/new',
    isAuth,
    isActivated,
    body('groupId').isLength({ min: 1 }).withMessage('A group ID is required to post.'),
    body('title').isLength({ min: 1 }).withMessage('A title is required for posts.'),
    postsController.newPost
);

router.put(
    '/edit',
    isAuth,
    isActivated,
    body('postId').isLength({ min: 1 }).withMessage('A post ID is required to edit a post.'),
    body('title').isLength({ min: 1 }).withMessage('The title of the post.'),
    body('text').isLength({ min: 1 }).withMessage('The text content of the post.'),
    postsController.editPost
);

router.delete(
    '/:postId',
    isAuth,
    isActivated,
    param('postId').isLength({ min: 1 }).withMessage('A post ID is required to delete a post.'),
    postsController.deletePost
);

router.get(
    '/:postId/messages',
    isAuth,
    isActivated,
    body('postId').isLength({ min: 1 }).withMessage('A post ID is required to get messages from a post.'),
    postsController.getMessages
);

router.post(
    '/add-message',
    isAuth,
    isActivated,
    upload.single('attachment'),
    body('postId').isLength({ min: 1 }).withMessage('A post ID for this message must be provided.'),
    body('content').custom((value, { req }) => {
        if (req.file || value.length > 0) {
            return true;
        } else {
            throw new Error('Message must have either text content or an attachment.');
        }
    }),
    messagesController.newMessage
);

router.post(
    '/delete-message',
    isAuth,
    isActivated,
    body('messageId').isLength({ min: 1 }).withMessage('A message ID must be provided.'),
    messagesController.deleteMessage
);

export default router;