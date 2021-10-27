import express, { Request, Response, NextFunction } from 'express';
import { expect } from 'chai';
import request from 'supertest';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
process.env.NODE_ENV = 'test';

import RequestError from '../util/error';
import isAuth from '../middleware/auth';
import isActivated from '../middleware/activated';
import User from '../models/user';
import * as authController from '../controllers/auth';

describe('Auth Tests', () => {
    const app = express();

    const testUsername = 'test_username';
    const testEmail = 'test_email@test.com';

    before(function () {
        app.use(express.json());

        app.get('/ping', isAuth, authController.ping);
        app.post('/signup', authController.signUp);
        app.put('/login', authController.logIn);
        app.put('/confirm-email', isAuth, authController.confirmEmail);

        app.use((error: RequestError, req: Request, res: Response, next: NextFunction) => {
            return res.status(error.code || 500).json({
                message: error.message
            });
        });
    });

    afterEach(function () {
        return User.findByEmail(testEmail).then(user => {
            return user.delete();
        }).catch(error => {
            return Promise.resolve();
        })
    });

    it('should throw an error if no authorization header is present', function () {
        const req = {
            get: (header: string): string | undefined | null => {
                return 'asdf';
            }
        } as Request;

        const nextFn: NextFunction = () => { };

        expect(isAuth.bind(this, req, {} as Response, nextFn)).to.throw('Not Authorized');
    });

    it('should throw an error if the account is not activated', function () {
        const req = {
            activated: false
        } as Request;

        const nextFn: NextFunction = () => { };

        expect(isActivated.bind(this, req, {} as Response, nextFn)).to.throw('Not Authorized');
    })

    it('should be able to sign a user up', function () {
        return request(app)
            .post('/signup')
            .send({ firstName: 'test_first', lastName: 'test_last', username: testUsername, email: testEmail, password: 'asdf' })
            .expect(201);
    });

    it('should fail to activate accounts with a wrong code', function () {
        return request(app)
            .post('/signup')
            .send({ firstName: 'test_first', lastName: 'test_last', username: testUsername, email: testEmail, password: 'asdf' })
            .then(res => {
                const token = res.body.token;
                return request(app)
                    .put('/confirm-email')
                    .set('Authorization', 'Bearer ' + token)
                    .send({ activateToken: '0' })
                    .expect(406);
            });
    });

    it('should activate account with correct activation code', function () {
        return request(app)
            .post('/signup')
            .send({ firstName: 'test_first', lastName: 'test_last', username: testUsername, email: testEmail, password: 'asdf' })
            .then(res => {
                const token = res.body.token;

                return User.findByEmail(testEmail).then(user => {
                    return request(app)
                        .put('/confirm-email')
                        .set('Authorization', 'Bearer ' + token)
                        .send({ activateToken: user.activateToken })
                        .expect(200);
                });
            });
    });

    it('should log in with working credentials', function () {
        return request(app)
            .post('/signup')
            .send({ firstName: 'test_first', lastName: 'test_last', username: testUsername, email: testEmail, password: 'asdf' })
            .then(res => {
                const token = res.body.token;

                return User.findByEmail(testEmail).then(user => {
                    return request(app)
                        .put('/confirm-email')
                        .set('Authorization', 'Bearer ' + token)
                        .send({ activateToken: user.activateToken })
                        .expect(200);
                });
            }).then(() => {
                return request(app)
                    .put('/login')
                    .send({ email: testEmail, password: 'asdf' })
                    .expect(200);
            });
    });

    it('should throw an error with an incorrect email or password', function () {
        return request(app)
            .post('/signup')
            .send({ firstName: 'test_first', lastName: 'test_last', username: testUsername, email: testEmail, password: 'asdf' })
            .then(res => {
                const token = res.body.token;

                return User.findByEmail(testEmail).then(user => {
                    return request(app)
                        .put('/confirm-email')
                        .set('Authorization', 'Bearer ' + token)
                        .send({ activateToken: user.activateToken })
                        .expect(200);
                });
            }).then(() => {
                return request(app)
                    .put('/login')
                    .send({ email: testEmail, password: 'incorrect_password' })
                    .expect(401);
            });
    });

    it('should return authenticated on a authorized ping', function () {
        let token: string;
        return request(app)
            .post('/signup')
            .send({ firstName: 'test_first', lastName: 'test_last', username: testUsername, email: testEmail, password: 'asdf' })
            .then(res => {
                token = res.body.token;

                return User.findByEmail(testEmail).then(user => {
                    return request(app)
                        .put('/confirm-email')
                        .set('Authorization', 'Bearer ' + token)
                        .send({ activateToken: user.activateToken })
                });
            }).then(() => {
                return request(app)
                    .get('/ping')
                    .set('Authorization', 'Bearer ' + token)
                    .send()
                    .expect(200);
            });
    });

    it('should throw an error on an unauthorized ping', function () {
        return request(app)
            .post('/signup')
            .send({ firstName: 'test_first', lastName: 'test_last', username: testUsername, email: testEmail, password: 'asdf' })
            .then(res => {
                const token = res.body.token;

                return User.findByEmail(testEmail).then(user => {
                    return request(app)
                        .put('/confirm-email')
                        .set('Authorization', 'Bearer ' + token)
                        .send({ activateToken: user.activateToken })
                        .expect(200);
                });
            }).then(() => {
                return request(app)
                    .get('/ping')
                    .set('Authorization', 'Bearer inauthentic_token')
                    .send();
            }).then(res => {
                expect(res.statusCode).to.not.equal(200);
            });
    });
});

describe('Password Reset Tests', () => {
    const app = express();

    const testUsername = 'test_username';
    const testEmail = 'test_email@test.com';

    process.env.NODE_ENV = 'test';

    before(async function () {
        dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
        app.use(express.json());

        app.put('/request-new-password', authController.requestPasswordReset);
        app.put('/reset-password', authController.resetPassword);

        app.use((error: RequestError, req: Request, res: Response, next: NextFunction) => {
            return res.status(error.code || 500).json({
                message: error.message
            });
        });

        const newUser = new User({
            firstName: 'Test_First',
            lastName: 'Test_Last',
            username: testUsername,
            email: testEmail,
            hashedPassword: 'not_set',
            activated: false
        });

        await newUser.create();
    });

    beforeEach(async function () {
        const user = await User.findByEmail(testEmail);
        user.resetPasswordToken = null;
        await user.update();
    });

    after(async function () {
        const user = await User.findByEmail(testEmail);
        await user.delete();
    })

    it('should set a token when a password reset is requested', function () {
        return request(app)
            .put('/request-new-password')
            .send({ email: testEmail })
            .expect(200)
            .then(() => {
                return User.findByEmail(testEmail);
            }).then(user => {
                expect(user.resetPasswordToken).to.not.be.equal(null);
                expect(user.resetPasswordToken).to.not.be.equal(undefined);
            });
    });

    it('should reset a password', async function () {
        let originalHashedPassword: string | null = null;

        return request(app)
            .put('/request-new-password')
            .send({ email: testEmail })
            .expect(200)
            .then(() => {
                return User.findByEmail(testEmail);
            }).then(user => {
                originalHashedPassword = user.hashedPassword;

                return request(app)
                    .put('/reset-password')
                    .send({ resetPasswordToken: user.resetPasswordToken, newPassword: 'new_reset_password' })
                    .expect(200);
            }).then(res => {
                return User.findByEmail(testEmail);
            }).then(user => {
                expect(user.hashedPassword).to.not.equal(originalHashedPassword);
            });
    });
});