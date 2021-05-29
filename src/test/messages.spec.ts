import express, { Request, Response, NextFunction } from 'express';
import { expect } from 'chai';
import request from 'supertest';

import RequestError from '../util/error';
import User from '../models/user';
import * as messagesController from '../controllers/messages';

describe('Messages Tests', () => {
    const app = express();

    before(() => {
        app.use(express.json());

        app.use((req: Request, res: Response, next: NextFunction) => {
            const testUser = new User({
                firstName: 'John',
                lastName: 'Champion',
                email: 'john@bison.software',
                hashedPassword: 'hashed_password',
                activated: true,
                activateToken: ''
            });
            return testUser.create().then(() => {
                req.userId = testUser.id;
                return next();
            });
        });

        app.get('/conversations', messagesController.getConversations);
        app.use((error: RequestError, req: Request, res: Response, next: NextFunction) => {
            return res.status(error.code || 500).json({
                message: error.message
            });
        });
    });

    after(() => {
        return User.findByEmail('john@bison.software').then(user => {
            return user.delete();
        })
    });

    it('should be able to create a new conversation', function () {
        
    });

    it('should be able to retrieve a user\'s conversations', function () {
        return request(app)
            .get('/conversations')
            .expect(200);
    });

    it('should be able to update a conversation', function () {
        
    });

    it('should be able to remove a user from a conversation and delete that conversation', function () {

    });
});