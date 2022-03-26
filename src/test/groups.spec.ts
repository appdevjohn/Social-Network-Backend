import express, { Request, Response, NextFunction } from 'express';
import { expect } from 'chai';
import request from 'supertest';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
process.env.NODE_ENV = 'test';

import * as groupsController from '../controllers/groups';
import User from '../models/user';
import RequestError from '../util/error';
import Group from '../models/group';

describe('Groups Tests', () => {
    const app = express();

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

        app.get('/validate/:groupName', groupsController.validateGroupName);
        app.get('/', groupsController.getGroups);
        app.get('/:groupId', groupsController.getGroup);
        app.post('/new', groupsController.newGroup);
        app.put('/edit', groupsController.editGroup);
        app.delete('/delete/:groupId', groupsController.deleteGroup);
        app.post('/:groupId/add-user', groupsController.addUserToGroup);
        app.post('/:groupId/remove-user', groupsController.removeUserFromGroup);
        app.post('/:groupId/requests/:userId/approve', groupsController.approveUserJoinRequest);
        app.put('/:groupId/set-admin', groupsController.setAdminStatusOfMember);
        app.get('/:groupId/requests', groupsController.getGroupJoinRequests);
        app.get('/:groupId/admins', groupsController.getAdminsInGroup);
        app.get('/:groupId/members', groupsController.getMembersInGroup);

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

    it('should be able to validate a valid group name', function () {
        const testGroup = new Group({
            name: 'test-group',
            description: 'test-group-description'
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
            name: 'test-group',
            description: 'test-group-description'
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
            name: 'test-group',
            description: 'test-group-description'
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
            .send({ name: 'Create Group', description: 'Description of the created group.' })
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
            name: 'To Be Updated',
            description: 'to-be-updated-description'
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
            name: 'To Be Deleted',
            description: 'to-be-deleted-description'
        });

        return testGroup.create().then(() => {
            return request(app)
                .delete(`/delete/${testGroup.id}`)
                .expect(200);

        }).then(() => {
            return testGroup.isCreated();

        }).then(isCreated => {
            expect(isCreated).to.be.equal(false);
        });
    });

    it('should be able to add a user to a group', async function () {
        const userToAdd = new User({
            firstName: 'userToAdd_first',
            lastName: 'userToAdd_last',
            username: 'userToAdd_username',
            email: 'userToAdd@test.com',
            hashedPassword: 'hashed_password',
            activated: true,
            activateToken: ''
        });

        await userToAdd.create();

        const createGroupResponse = await request(app)
            .post('/new')
            .send({ name: 'Add User to this Group', description: 'Adding user to this group.' })
            .expect(201);

        const groupId = createGroupResponse.body.group.id;

        await request(app)
            .post(`/${groupId}/add-user`)
            .send({ userId: userToAdd.id })
            .expect(201);

        const group = await Group.findById(groupId);
        await group.delete();
        await userToAdd.delete();
    });

    it('should be able to remove a user from a group', async function () {
        const userToAdd = new User({
            firstName: 'userToAdd_first',
            lastName: 'userToAdd_last',
            username: 'userToAdd_username',
            email: 'userToAdd@test.com',
            hashedPassword: 'hashed_password',
            activated: true,
            activateToken: ''
        });

        await userToAdd.create();

        const createGroupResponse = await request(app)
            .post('/new')
            .send({ name: 'Add User to this Group', description: 'Removing user from this group.' })
            .expect(201);

        const groupId = createGroupResponse.body.group.id;

        await request(app)
            .post(`/${groupId}/add-user`)
            .send({ userId: userToAdd.id })
            .expect(201);

        await request(app)
            .post(`/${groupId}/remove-user`)
            .send({ userId: userToAdd.id })
            .expect(200);

        const group = await Group.findById(groupId);
        await group.delete();
        await userToAdd.delete();
    });

    it('should be able to approve a user\'s join request', async function () {
        const userToAdd = new User({
            firstName: 'userToAdd_first',
            lastName: 'userToAdd_last',
            username: 'userToAdd_username',
            email: 'userToAdd@test.com',
            hashedPassword: 'hashed_password',
            activated: true,
            activateToken: ''
        });

        await userToAdd.create();

        const createGroupResponse = await request(app)
            .post('/new')
            .send({ name: 'Add User to this Group', description: 'Adding user to this group.' })
            .expect(201);

        const groupId = createGroupResponse.body.group.id;

        await request(app)
            .post(`/${groupId}/add-user`)
            .send({ userId: userToAdd.id })
            .expect(201);

        await request(app)
            .post(`/${groupId}/requests/${userToAdd.id}/approve`)
            .expect(200);

        const group = await Group.findById(groupId);
        const memberLength = (await group.members()).length;

        await group.delete();
        await userToAdd.delete();

        expect(memberLength).to.equal(2);
    });

    it('should be able to give and remove admin status to a member of a group', async function () {
        // PUT /groups/:groupId/set-admin

        const userToAdd = new User({
            firstName: 'userToMakeAdmin_first',
            lastName: 'userToMakeAdmin_last',
            username: 'userToMakeAdmin_username',
            email: 'userToMakeAdmin@test.com',
            hashedPassword: 'hashed_password',
            activated: true,
            activateToken: ''
        });

        await userToAdd.create();

        const createGroupResponse = await request(app)
            .post('/new')
            .send({ name: 'View Requests of this Group', description: 'Will view requests of this group.' })
            .expect(201);

        const groupId = createGroupResponse.body.group.id;

        await request(app)
            .post(`/${groupId}/add-user`)
            .send({ userId: userToAdd.id })
            .expect(201);

        await request(app)
            .put(`/${groupId}/set-admin`)
            .send({ userId: userToAdd.id, admin: true })
            .expect(200);


        let group = await Group.findById(groupId);
        let admins = await group.admins();
        let members = await group.members();

        expect(admins.length).to.equal(2);
        expect(members.length).to.equal(2);

        await request(app)
            .put(`/${groupId}/set-admin`)
            .send({ userId: userToAdd.id, admin: false })
            .expect(200);

        group = await Group.findById(groupId);
        admins = await group.admins();
        members = await group.members();

        expect(admins.length).to.equal(1);
        expect(members.length).to.equal(2);

        await group.delete();
        await userToAdd.delete();

    });

    it('should be able to get a list of join requests', async function () {
        const userToAdd = new User({
            firstName: 'userToAdd_first',
            lastName: 'userToAdd_last',
            username: 'userToAdd_username',
            email: 'userToAdd@test.com',
            hashedPassword: 'hashed_password',
            activated: true,
            activateToken: ''
        });

        await userToAdd.create();

        const createGroupResponse = await request(app)
            .post('/new')
            .send({ name: 'View Requests of this Group', description: 'Will view requests of this group.' })
            .expect(201);

        const groupId = createGroupResponse.body.group.id;

        await request(app)
            .post(`/${groupId}/add-user`)
            .send({ userId: userToAdd.id, approved: false })
            .expect(201);

        const requestsResult = await request(app)
            .get(`/${groupId}/requests`)
            .expect(200);

        const group = await Group.findById(groupId);
        await group.delete();
        await userToAdd.delete();

        expect(requestsResult?.body?.users).to.have.length(1);
    });

    it('should be able to get a list of admins for a group', async function () {
        const userToAdd = new User({
            firstName: 'userToAdd_first',
            lastName: 'userToAdd_last',
            username: 'userToAdd_username',
            email: 'userToAdd@test.com',
            hashedPassword: 'hashed_password',
            activated: true,
            activateToken: ''
        });

        await userToAdd.create();

        const createGroupResponse = await request(app)
            .post('/new')
            .send({ name: 'View Admins of this Group', description: 'Will view admins of this group.' })
            .expect(201);

        const groupId = createGroupResponse.body.group.id;

        await request(app)
            .post(`/${groupId}/add-user`)
            .send({ userId: userToAdd.id })
            .expect(201);

        const requestsResult = await request(app)
            .get(`/${groupId}/admins`)
            .expect(200);

        const group = await Group.findById(groupId);
        await group.delete();
        await userToAdd.delete();

        expect(requestsResult?.body?.admins).to.have.length(1);
    });
});