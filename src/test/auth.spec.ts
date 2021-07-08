import express, { Request, Response, NextFunction } from 'express';
import { expect } from 'chai';
import request from 'supertest';

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
            .expect(201)
            .then(res => {
                return User.findByEmail(testEmail);
            }).then(user => {
                return user.delete();
            });
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
            }).then(() => {
                return User.findByEmail(testEmail);
            }).then(user => {
                return user.delete();
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
            }).then(() => {
                return User.findByEmail(testEmail);
            }).then(user => {
                return user.delete();
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
            }).then(() => {
                return User.findByEmail(testEmail);
            }).then(user => {
                return user.delete();
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
            }).then(() => {
                return User.findByEmail(testEmail);
            }).then(user => {
                return user.delete();
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
            }).then(() => {
                return User.findByEmail(testEmail);
            }).then(user => {
                return user.delete();
            });
    });

    it('should throw an error on an unauthorized ping', async function () {
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
            }).then(() => {
                return User.findByEmail(testEmail);
            }).then(user => {
                return user.delete();
            });
    });
});