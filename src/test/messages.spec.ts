import express, { Request, Response, NextFunction } from 'express';
import { expect } from 'chai';
import request from 'supertest';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
process.env.NODE_ENV = 'test';

import RequestError from '../util/error';
import User from '../models/user';
import Message from '../models/message';
import Conversation from '../models/conversation';
import * as messagesController from '../controllers/messages';
import { ContentType } from '../database/messages';

describe('Messages Tests', () => {
    const app = express();

    const testUsername = 'test_username';
    const testEmail = 'test_email@test.com';

    before(async function () {
        app.use(express.json());

        const testUser = new User({
            firstName: 'test_first',
            lastName: 'test_last',
            username: 'test_username',
            email: testEmail,
            hashedPassword: 'hashed_password',
            activated: true,
            activateToken: ''
        });
        await testUser.create();


        app.use((req: Request, res: Response, next: NextFunction) => {
            req.userId = testUser.id;
            return next();
        });

        app.get('/validate-recipient/:username', messagesController.canMessageUser);
        app.get('/conversations', messagesController.getConversations);
        app.post('/conversations/new', messagesController.newConversation);
        app.put('/conversations/edit', messagesController.editConversation);
        app.put('/conversations/leave', messagesController.leaveConversation);
        app.post('/messages/new', messagesController.newMessage);
        app.delete('/messages/delete', messagesController.deleteMessage);
        app.get('/conversations/:convoId', messagesController.getConversation);
        app.get('/conversations/:convoId/messages', messagesController.getMessages);
        app.get('/messages/:messageId', messagesController.getMessage);
        app.put('/conversations/update-last-read-message', messagesController.updateLastReadMessageOfConversation);
        app.use((error: RequestError, req: Request, res: Response, next: NextFunction) => {
            console.error(error.message);
            return res.status(error.code || 500).json({
                message: error.message
            });
        });

        return;
    });

    after(function () {
        return User.findByEmail(testEmail).then(user => {
            return user.delete();
        });
    });

    it('should be able to create a new conversation', function () {
        return request(app)
            .post('/conversations/new')
            .send({ name: 'Test Conversation', members: ['automated_test_member'] })
            .expect(201)
            .then(res => {
                const convoId = res.body.conversation.id;
                return Conversation.findById(convoId);
            }).then(conversation => {
                return conversation.delete();
            });
    });

    it('should be able to retrieve a user\'s conversations', function () {
        return request(app)
            .get('/conversations')
            .expect(200);
    });

    it('should be able to update a conversation', function () {
        const existingConversation = new Conversation({
            name: 'Existing Conversation'
        });
        return existingConversation.create().then(() => {

            return request(app)
                .put('/conversations/edit')
                .send({ convoId: existingConversation.id, newName: 'Updated Conversation Name' })
                .expect(200)
                .then(req => {
                    return existingConversation.delete();
                });
        });
    });

    it('should be able to remove a user from a conversation and delete that conversation', function () {
        const conversationToLeave = new Conversation({
            name: 'Test Leave Conversation'
        });
        return conversationToLeave.create().then(() => {
            return User.findByEmail(testEmail);

        }).then(user => {
            return conversationToLeave.addUser(user.id!);

        }).then(() => {
            return request(app)
                .put('/conversations/leave')
                .send({ convoId: conversationToLeave.id })
                .expect(200);

        }).then(() => {
            return conversationToLeave.isCreated();

        }).then(conversationIsInDatabase => {
            expect(conversationIsInDatabase).to.be.equal(false);
        });
    });

    it('should be able to send a message in a conversation', function () {
        const testConversation = new Conversation({
            name: 'Test Conversation (Send Message Test)'
        });
        return testConversation.create().then(() => {
            return User.findByEmail(testEmail);

        }).then(() => {
            return request(app)
                .post('/messages/new')
                .send({ convoId: testConversation.id, content: 'Message sent in Test Conversation.', type: 'text' })
                .expect(201);

        }).then(() => {
            return testConversation.delete();
        });
    });

    it('should be able to delete a message in a conversation or post', function () {
        const testConversation = new Conversation({
            name: 'Test Conversation (Delete Message Test)'
        });
        return testConversation.create().then(() => {
            return User.findByEmail(testEmail);

        }).then(() => {
            return request(app)
                .post('/messages/new')
                .send({ convoId: testConversation.id, content: 'Message to be deleted for a test.', type: 'text' });

        }).then(res => {
            const messageId = res.body.message.id;

            return request(app)
                .delete('/messages/delete')
                .send({ messageId: messageId })
                .expect(200);

        }).then(() => {
            return testConversation.delete();
        });
    });

    it('should be able to get messages from a conversation', function () {
        const testConversation = new Conversation({
            name: 'Test Conversation (Get Messages from Convo Test)'
        });
        return testConversation.create().then(() => {
            return User.findByEmail(testEmail);

        }).then(user => {
            const message1 = new Message({
                userId: user.id!,
                convoId: testConversation.id,
                content: 'Message 1',
                type: 'text' as ContentType
            });
            const message2 = new Message({
                userId: user.id!,
                convoId: testConversation.id,
                content: 'Message 2',
                type: 'text' as ContentType
            });

            const addMessagePromises = [message1.create(), message2.create()];
            return Promise.all(addMessagePromises);

        }).then(() => {
            return request(app)
                .get('/conversations/' + testConversation.id + '/messages')
                .expect(200);

        }).then(res => {
            const messages = res.body.messages;
            expect(messages).to.have.lengthOf(2);

            return testConversation.delete();
        });
    });

    it('should be able to get a conversation\'s data', function () {
        const testConversation = new Conversation({
            name: 'Test Conversation (Get Convo Data Test)'
        });

        let user: User;
        return testConversation.create().then(() => {
            return User.findByEmail(testEmail);

        }).then(usr => {
            user = usr;
            return testConversation.addUser(user.id!);

        }).then(() => {
            const message1 = new Message({
                userId: user.id!,
                convoId: testConversation.id,
                content: 'Message 1',
                type: 'text' as ContentType
            });
            const message2 = new Message({
                userId: user.id!,
                convoId: testConversation.id,
                content: 'Message 2',
                type: 'text' as ContentType
            });

            const addMessagePromises = [message1.create(), message2.create()];
            return Promise.all(addMessagePromises);

        }).then(() => {
            return request(app)
                .get('/conversations/' + testConversation.id)
                .expect(200);

        }).then(res => {
            expect(res.body).to.have.property('conversation');
            expect(res.body).to.have.property('members');
            expect(res.body).to.have.property('messages');

            return testConversation.delete();
        });
    });

    it('should be able to get a single message', function () {
        const testConversation = new Conversation({
            name: 'Test Conversation (Get Single Message Test)'
        });

        let message: Message;
        return testConversation.create().then(() => {
            return User.findByEmail(testEmail);

        }).then(user => {
            message = new Message({
                userId: user.id!,
                convoId: testConversation.id,
                content: 'Test Message',
                type: 'text' as ContentType
            });

            return message.create();

        }).then(() => {
            return request(app)
                .get('/messages/' + message.id)
                .expect(200);

        }).then(res => {
            expect(res.body.message.content).to.be.equal('Test Message');

            return testConversation.delete();
        });
    });

    it('should be able to validate a valid recipient', function () {
        return request(app)
            .get('/validate-recipient/' + testUsername)
            .send()
            .expect(200)
            .then(res => {
                const validity = res.body.valid;
                expect(validity).to.be.equal(true);
            })
    });

    it('should be able to validate an invalid recipient', function () {
        return request(app)
            .get('/validate-recipient/does-not-exist')
            .send()
            .expect(200)
            .then(res => {
                const validity = res.body.valid;
                expect(validity).to.be.equal(false);
            })
    });

    it('should log the last read message for a conversation', async function () {
        // Set Up
        const user = await User.findByEmail(testEmail);
        const secondUser = new User({
            firstName: 'test_first_2',
            lastName: 'test_last_2',
            username: 'test_username_2',
            email: 'test_email_2@test.com',
            hashedPassword: 'hashed_password_2',
            activated: true,
            activateToken: ''
        });
        await secondUser.create();

        const newConversation = new Conversation({ name: 'Test Conversation' });
        await newConversation.create();

        newConversation.addUser(user.id!);
        newConversation.addUser(secondUser.id!);

        const newMessage = new Message({
            userId: user.id!,
            convoId: newConversation.id,
            content: 'Test Message',
            type: ContentType.Text
        });
        await newMessage.create();

        // Perform Test
        const updatedLastMessageId = await Conversation.updateLastReadMessage(newMessage.id!, newConversation.id!, secondUser.id!);
        const gottenLastMessageId = await Conversation.getLastReadMessageId(newConversation.id!, secondUser.id!);

        expect(updatedLastMessageId).to.be.equal(newMessage.id!);
        expect(gottenLastMessageId).to.be.equal(newMessage.id!);

        // Wrap Up
        await secondUser.delete();
        await newConversation.delete();
        return;
    });

    it('should be able to update the last read message id with a request', async function () {
        // Set Up
        const user = await User.findByEmail(testEmail);
        const secondUser = new User({
            firstName: 'test_first_2',
            lastName: 'test_last_2',
            username: 'test_username_2',
            email: 'test_email_2@test.com',
            hashedPassword: 'hashed_password_2',
            activated: true,
            activateToken: ''
        });
        await secondUser.create();

        const newConversation = new Conversation({ name: 'Test Conversation' });
        await newConversation.create();

        newConversation.addUser(user.id!);
        newConversation.addUser(secondUser.id!);

        const newMessage = new Message({
            userId: user.id!,
            convoId: newConversation.id,
            content: 'Test Message',
            type: ContentType.Text
        });
        await newMessage.create();

        // Perform Test
        const res = await request(app)
            .put('/conversations/update-last-read-message')
            .send({ convoId: newConversation.id, messageId: newMessage.id })
            .expect(200);
        expect(res.body.messageId).to.be.equal(newMessage.id);

        // Wrap Up
        await secondUser.delete();
        await newConversation.delete();
        return;
    });
});