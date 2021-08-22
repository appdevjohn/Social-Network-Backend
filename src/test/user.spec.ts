import express, { Request, Response, NextFunction } from 'express';
import { expect } from 'chai';
import request from 'supertest';
import dotenv from 'dotenv';
import path from 'path';

import * as usersController from '../controllers/users';
import User from '../models/user';
import RequestError from '../util/error';

describe('User Tests', () => {
    const app = express();

    const testUsername = 'test_username';
    const testEmail = 'test_email@test.com';

    before(async function () {
        dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
        app.use(express.json());

        const testUser = new User({
            firstName: 'test_first',
            lastName: 'test_last',
            username: testUsername,
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

        app.get('/:userId', usersController.getUser);
        app.put('/edit', usersController.updateUser);

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

    it('should be able to get a user', function () {
        return User.findByEmail(testEmail).then(user => {
            return request(app).get('/' + user.id).expect(200);
        });
    });

    it('should be able to edit a user', function () {
        return User.findByEmail(testEmail).then(user => {
            return request(app)
                .put('/edit')
                .send({ userId: user.id, firstName: 'new_first', lastName: 'new_last' })
                .expect(201)
                .then(res => {
                    expect(res.body.user.firstName).to.be.equal('new_first');
                    expect(res.body.user.lastName).to.be.equal('new_last');
                    expect(res.body.user.username).to.be.equal('test_username');
                });
        })
    });
});