import { Router } from 'express';
import * as postsController from '../controllers/posts';
import isAuth from '../middleware/auth';

const router = Router();

router.get('/', isAuth, postsController.getPosts);

router.get('/:postId', isAuth, postsController.getPost);

router.post('/new', isAuth, postsController.newPost);

router.post('/edit', isAuth, postsController.editPost);

router.post('/delete', isAuth, postsController.deletePost);

router.post('/messages/new', isAuth, postsController.newMessage);

router.post('/messages/delete', isAuth, postsController.deleteMessage);

export default router;