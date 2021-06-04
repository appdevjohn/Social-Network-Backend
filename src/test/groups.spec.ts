import express, { Request, Response, NextFunction } from 'express';
import { expect } from 'chai';
import request from 'supertest';

import * as groupsController from '../controllers/groups';
import User from '../models/user';
import RequestError from '../util/error';
import Group from '../models/group';

describe('Groups Tests', () => {
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

        app.get('/validate/:groupName', groupsController.validateGroupName);
        app.get('/', groupsController.getGroups);
        app.get('/:groupId', groupsController.getGroup);
        app.post('/new', groupsController.newGroup);
        app.put('/edit', groupsController.editGroup);
        app.delete('/delete', groupsController.deleteGroup);
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

    it('should be able to validate a valid group name', function () {
        const testGroup = new Group({
            name: 'test-group'
        });

        return testGroup.create().then(() => {
            return request(app)
                .get('/validate/test-group')
                .expect(200);

        }).then(res => {
            const validity = res.body.valid;
            expect(validity).to.be.equal(true);

            return testGroup.delete();
        });
    });

    it('should be able to validate an invalid group name', function () {
        const testGroup = new Group({
            name: 'test-group'
        });

        return testGroup.create().then(() => {
            return request(app)
                .get('/validate/invalid-group-name')
                .expect(200);

        }).then(res => {
            const validity = res.body.valid;
            expect(validity).to.be.equal(false);

            return testGroup.delete();
        });
    });

    it('should be able to get a user\'s groups', function () {
        return request(app)
            .get('/')
            .expect(200);
    });

    it('should be able to get a specific group', function () {
        const testGroup = new Group({
            name: 'test-group'
        });

        return testGroup.create().then(() => {
            return request(app)
                .get('/' + testGroup.id)
                .expect(200);

        }).then(res => {
            const groupName = res.body.group.name;
            expect(groupName).to.be.equal('test-group');

            return testGroup.delete();
        });
    });

    it('should be able to create a new group', function () {
        return request(app)
            .post('/new')
            .send({ name: 'Create Group' })
            .expect(201)
            .then(res => {
                const groupId = res.body.group.id;
                return Group.findById(groupId);
            }).then(group => {
                return group.delete();
            });
    });

    it('should be able to edit an existing group', function () {
        const testGroup = new Group({
            name: 'To Be Updated'
        });

        return testGroup.create().then(() => {
            return request(app)
                .put('/edit')
                .send({ id: testGroup.id, name: 'Updated Name' })
                .expect(200);

        }).then(res => {
            const groupName = res.body.group.name;
            expect(groupName).to.be.equal('Updated Name');

            return testGroup.delete();
        });
    });

    it('should be able to delete an existing group', function () {
        const testGroup = new Group({
            name: 'To Be Deleted'
        });

        return testGroup.create().then(() => {
            return request(app)
                .delete('/delete')
                .send({ id: testGroup.id })
                .expect(200);

        }).then(() => {
            return testGroup.isCreated();

        }).then(isCreated => {
            expect(isCreated).to.be.equal(false);
        });
    });
});