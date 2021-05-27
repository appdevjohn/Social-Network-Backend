import { Router } from 'express';
import * as messagesController from '../controllers/messages';
import isAuth from '../middleware/auth';

const router = Router();

router.get('/conversations', isAuth, messagesController.getConversations);

router.get('/conversations/:convoId', isAuth, messagesController.getMessages);

router.get('/messages/:messageId', isAuth, messagesController.getMessage);

router.post('/conversations/new', isAuth, messagesController.postNewConversation);

router.post('/conversations/edit', isAuth, messagesController.postEditConversation);

router.post('/conversations/delete', isAuth, messagesController.postDeleteConversation);

router.post('/conversations/leave', isAuth, messagesController.postLeaveConversation);

router.post('/messages/new', isAuth, messagesController.postNewMessage);

router.post('/messages/edit', isAuth, messagesController.postEditMessage);

router.post('/messages/delete', isAuth, messagesController.postDeleteMessage);

export default router;