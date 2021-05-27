import { Router } from 'express';
import * as postsController from '../controllers/posts';
import isAuth from '../middleware/auth';

const router = Router();

router.get('/', isAuth, postsController.getPosts);

router.get('/:postId', isAuth, postsController.getPost);

router.post('/new', isAuth, postsController.postNewPost);

router.post('/edit', isAuth, postsController.postEditPost);

router.post('/delete', isAuth, postsController.postEditPost);

router.post('/messages/new', isAuth, postsController.postNewMessage);

router.post('/messages/edit', isAuth, postsController.postEditMessage);

router.post('/messages/delete', isAuth, postsController.postDeleteMessage);

export default router;