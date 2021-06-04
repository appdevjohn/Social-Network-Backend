import express, { Request, Response, NextFunction } from 'express';
import { expect } from 'chai';
import request from 'supertest';

import * as postsController from '../controllers/posts';
import User from '../models/user';
import RequestError from '../util/error';

describe('Posts Tests', () => {
    const app = express();

    before(async function () {
        app.use(express.json());

        const testUser = new User({
            firstName: 'John',
            lastName: 'Champion',
            username: 'appdevjohn',
            email: 'john@bison.software',
            hashedPassword: 'hashed_password',
            activated: true,
            activateToken: ''
        });
        await testUser.create();

        app.get('/', postsController.getPosts);
        app.get('/:postId', postsController.getPost);
        app.post('/new', postsController.newPost);
        app.post('/edit', postsController.editPost);
        app.post('/delete', postsController.deletePost);
        app.post('/messages/new', postsController.newMessage);
        app.post('/messages/delete', postsController.deleteMessage);
        app.use((req: Request, res: Response, next: NextFunction) => {
            req.userId = testUser.id;
            return next();
        });

        app.use((error: RequestError, req: Request, res: Response, next: NextFunction) => {
            console.error(error.message);
            return res.status(error.code || 500).json({
                message: error.message
            });
        });

        return;
    });

    after(function () {
        return User.findByEmail('john@bison.software').then(user => {
            return user.delete();
        });
    });
});