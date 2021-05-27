import express, { Request, Response, NextFunction } from 'express';
import { expect } from 'chai';
import request from 'supertest';
import bcrypt from 'bcrypt';

import RequestError from '../util/error';
import isAuth from '../middleware/auth';
import User from '../models/user';
import * as authController from '../controllers/auth';

describe('Auth Tests', () => {
    after(async function () {
        try {
            const user = await User.findByEmail('john@bison.software');
            await user.delete();

        } catch (error) {
            throw new Error('Could not clean up after auth tests.');
        }
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

    it('should be able to sign a user up', function (done) {
        const app = express();
        app.use(express.json());

        app.use(authController.signUp);
        app.use((error: RequestError, req: Request, res: Response, next: NextFunction) => {
            return res.status(error.code || 500).json({
                message: error.message
            });
        });

        request(app)
            .post('/')
            .send({ firstName: 'John', lastName: 'Champion', email: 'john@bison.software', password: 'asdf' })
            .expect(201, done);
    });

    it('should fail to activate accounts with a wrong code', async function () {
        const app = express();
        app.use(express.json());

        let user: User;
        try {
            user = await User.findByEmail('john@bison.software');
        } catch (error) {
            throw new Error('Could not find user.');
        }

        app.use((req: Request, res: Response, next: NextFunction) => {
            req.userId = user.id;
            next();
        })
        app.use(authController.confirmEmail);
        app.use((error: RequestError, req: Request, res: Response, next: NextFunction) => {
            return res.status(error.code || 500).json({
                message: error.message
            });
        });

        if (user) {
            return request(app)
                .post('/')
                .send({ activateToken: '0' })
                .then(res => {
                    expect(res.statusCode).to.not.equal(200);
                });
        } else {
            throw new Error('Could not find user.');
        }
    });

    it('should activate account with correct activation code', async function () {
        const app = express();
        app.use(express.json());

        let user: User;
        try {
            user = await User.findByEmail('john@bison.software');
        } catch (error) {
            throw new Error('Could not find user.');
        }

        app.use((req: Request, res: Response, next: NextFunction) => {
            req.userId = user.id;
            next();
        })
        app.use(authController.confirmEmail);
        app.use((error: RequestError, req: Request, res: Response, next: NextFunction) => {
            return res.status(error.code || 500).json({
                message: error.message
            });
        });

        if (user) {
            return request(app)
                .post('/')
                .send({ activateToken: user.activateToken })
                .expect(200);
        } else {
            throw new Error('Could not find user.');
        }
    });

    it('should log in with working credentials', function (done) {
        const app = express();
        app.use(express.json());

        app.use(authController.logIn);
        app.use((error: RequestError, req: Request, res: Response, next: NextFunction) => {
            return res.status(error.code || 500).json({
                message: error.message
            });
        });

        request(app)
            .post('/')
            .send({ email: 'john@bison.software', password: 'asdf' })
            .then(res => {
                expect(res.statusCode).to.equal(200);
                done();
            }).catch(error => {
                console.log('ERROR');
                console.log(error);
                done(error)
            });
    });

    it('should throw an error with an incorrect email or password', function (done) {
        const app = express();
        app.use(express.json());

        app.use(authController.logIn);
        app.use((error: RequestError, req: Request, res: Response, next: NextFunction) => {
            return res.status(error.code || 500).json({
                message: error.message
            });
        });

        request(app)
            .post('/')
            .send({ email: 'john@bison.software', password: '' })
            .expect(401, done);
    });

    it('should return authenticated on a authorized ping', async function () {
        const app = express();
        app.use(express.json());

        let user: User;
        try {
            user = await User.findByEmail('john@bison.software');
        } catch (error) {
            throw new Error('Could not find user.');
        }

        app.use((req: Request, res: Response, next: NextFunction) => {
            req.userId = user.id;
            next();
        });
        app.use(authController.ping);
        app.use((error: RequestError, req: Request, res: Response, next: NextFunction) => {
            return res.status(error.code || 500).json({
                message: error.message
            });
        });

        return request(app)
            .post('/')
            .send()
            .expect(200);
    });

    it('should throw an error on an unauthorized ping', async function () {
        const app = express();
        app.use(express.json());

        app.use((req: Request, res: Response, next: NextFunction) => {
            req.userId = 'inauthentic_id';
            next();
        });
        app.use(authController.ping);
        app.use((error: RequestError, req: Request, res: Response, next: NextFunction) => {
            return res.status(error.code || 500).json({
                message: error.message
            });
        });

        return request(app)
            .post('/')
            .send()
            .then(res => {
                expect(res.statusCode).to.not.equal(200);
            });
    });
});