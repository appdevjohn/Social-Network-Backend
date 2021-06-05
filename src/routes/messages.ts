import { Router } from 'express';
import * as messagesController from '../controllers/messages';
import isAuth from '../middleware/auth';

const router = Router();

router.get('/validate-recipient/:username', isAuth, messagesController.canMessageUser);

router.get('/conversations', isAuth, messagesController.getConversations);

router.get('/conversations/:convoId', isAuth, messagesController.getConversation);

router.get('/conversations/:convoId/messages', isAuth, messagesController.getMessages);

router.get('/messages/:messageId', isAuth, messagesController.getMessage);

router.post('/conversations/new', isAuth, messagesController.newConversation);

router.put('/conversations/edit', isAuth, messagesController.editConversation);

router.put('/conversations/leave', isAuth, messagesController.leaveConversation);

router.post('/messages/new', isAuth, messagesController.newMessage);

router.delete('/messages/delete', isAuth, messagesController.deleteMessage);

export default router;