import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator';

import * as postsController from '../controllers/posts';
import * as messagesController from '../controllers/messages';
import Post from '../models/post';
import isAuth from '../middleware/auth';
import isActivated from '../middleware/activated';
import isGroupMember from '../middleware/groupMember';
import isPostOwner from '../middleware/postOwner';
import isMessageOwner from '../middleware/messageOwner';
import upload from '../util/upload';

const router = Router();

router.get(
    '/',
    isAuth,
    isActivated,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await isGroupMember(req.query.groupId as string, req, res, next);
            next();
        } catch (error) {
            return next(error);
        }
    },
    query('groupId').isLength({ min: 1 }).withMessage('A group ID is required to get posts.'),
    postsController.getPosts
);

router.get(
    '/:postId',
    isAuth,
    isActivated,
    async (req: Request, res: Response, next: NextFunction) => {
        let post;
        try {
            post = await Post.findById(req.params.postId);
        } catch (error) {
            return next();
        }
        
        try {
            await isGroupMember(post.groupId, req, res, next);
            return next();
        } catch (error) {
            return next(error);
        }
    },
    param('postId').isLength({ min: 1 }).withMessage('A post ID is required to get a post.'),
    postsController.getPost
);

router.post(
    '/new',
    isAuth,
    isActivated,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await isGroupMember(req.body.groupId, req, res, next);
            next();
        } catch (error) {
            return next(error);
        }
    },
    body('groupId').isLength({ min: 1 }).withMessage('A group ID is required to post.'),
    body('title').isLength({ min: 1 }).withMessage('A title is required for posts.'),
    postsController.newPost
);

router.put(
    '/edit',
    isAuth,
    isActivated,
    async (req: Request, res: Response, next: NextFunction) => {
        let post;
        try {
            post = await Post.findById(req.params.postId);
        } catch (error) {
            return next();
        }
        
        try {
            await isGroupMember(post.groupId, req, res, next);
            await isPostOwner(req.body.postId, req, res, next);
            next();
        } catch (error) {
            return next(error);
        }
    },
    body('postId').isLength({ min: 1 }).withMessage('A post ID is required to edit a post.'),
    body('title').isLength({ min: 1 }).withMessage('The title of the post.'),
    body('text').isLength({ min: 1 }).withMessage('The text content of the post.'),
    postsController.editPost
);

router.delete(
    '/:postId',
    isAuth,
    isActivated,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await isPostOwner(req.params.postId, req, res, next);
            next();
        } catch (error) {
            return next(error);
        }
    },
    param('postId').isLength({ min: 1 }).withMessage('A post ID is required to delete a post.'),
    postsController.deletePost
);

router.get(
    '/:postId/messages',
    isAuth,
    isActivated,
    async (req: Request, res: Response, next: NextFunction) => {
        let post;
        try {
            post = await Post.findById(req.params.postId);
        } catch (error) {
            return next();
        }
        
        try {
            await isGroupMember(post.groupId, req, res, next);
            return next();
        } catch (error) {
            return next(error);
        }
    },
    body('postId').isLength({ min: 1 }).withMessage('A post ID is required to get messages from a post.'),
    postsController.getMessages
);

router.post(
    '/add-message',
    isAuth,
    isActivated,
    async (req: Request, res: Response, next: NextFunction) => {
        let post;
        try {
            post = await Post.findById(req.body.postId);
        } catch (error) {
            return next();
        }
        
        try {
            await isGroupMember(post.groupId, req, res, next);
            return next();
        } catch (error) {
            return next(error);
        }
    },
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
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await isMessageOwner(req.body.messageId, req, res, next);
            return next();
        } catch (error) {
            return next(error);
        }
    },
    body('messageId').isLength({ min: 1 }).withMessage('A message ID must be provided.'),
    messagesController.deleteMessage
);

export default router;