import { Router } from 'express';
import * as postsController from '../controllers/posts';
import * as messagesController from '../controllers/messages';
import isAuth from '../middleware/auth';

const router = Router();

router.get('/', isAuth, postsController.getPosts);

router.get('/:postId', isAuth, postsController.getPost);

router.post('/new', isAuth, postsController.newPost);

router.put('/edit', isAuth, postsController.editPost);

router.delete('/delete', isAuth, postsController.deletePost);

router.get('/:postId/messages', isAuth, postsController.getMessages);

router.post('/add-message', isAuth, messagesController.newMessage);

router.get('/delete-message', isAuth, messagesController.deleteMessage);

export default router;