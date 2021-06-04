import express, { Request, Response, NextFunction } from 'express';
import { expect } from 'chai';
import request from 'supertest';

import * as postsController from '../controllers/posts';
import * as messagesController from '../controllers/messages';
import User from '../models/user';
import Post from '../models/post';
import Group from '../models/group';
import Message from '../models/message';
import RequestError from '../util/error';
import { ContentType } from '../database/messages';

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
        app.use((req: Request, res: Response, next: NextFunction) => {
            req.userId = testUser.id;
            return next();
        });

        app.get('/', postsController.getPosts);
        app.get('/:postId', postsController.getPost);
        app.post('/new', postsController.newPost);
        app.put('/edit', postsController.editPost);
        app.delete('/delete', postsController.deletePost);
        app.get('/:postId/messages', postsController.getMessages);
        app.post('/add-message', messagesController.newMessage);
        app.delete('/delete-message', messagesController.deleteMessage);

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

    it('should be able to retrieve posts from a group', function () {
        const testGroup = new Group({
            name: 'Test Group'
        });

        return testGroup.create().then(() => {
            return User.findByEmail('john@bison.software')

        }).then(user => {
            const testPost1 = new Post({
                userId: user.id!,
                groupId: testGroup.id!,
                title: 'Test Post 1',
                text: 'This is a post automatically generated during testing.'
            });
            const testPost2 = new Post({
                userId: user.id!,
                groupId: testGroup.id!,
                title: 'Test Post 2',
                text: 'This is a post automatically generated during testing.'
            });
            return Promise.all([testPost1.create(), testPost2.create()]);

        }).then(() => {
            return request(app)
                .get('/?groupId=' + testGroup.id)
                .expect(200);

        }).then(res => {
            const postsResponse = res.body.posts;
            expect(postsResponse).to.have.lengthOf(2);

            const getPostPromises: Post[] = postsResponse.map(({ id }: { id: string; }) => {
                return Post.findById(id);
            })
            return Promise.all(getPostPromises);

        }).then(posts => {
            const deletePostPromises = posts.map(post => {
                return post.delete();
            });
            return Promise.all(deletePostPromises);

        }).then(() => {
            return testGroup.delete();
        });
    });

    it('should be able to retrieve a single post', function () {
        const testGroup = new Group({
            name: 'Test Group'
        });

        let testPost: Post;
        return testGroup.create().then(() => {
            return User.findByEmail('john@bison.software')

        }).then(user => {
            testPost = new Post({
                userId: user.id!,
                groupId: testGroup.id!,
                title: 'Test Post',
                text: 'This is a post automatically generated during testing.'
            });
            return testPost.create();

        }).then(() => {
            return request(app)
                .get('/' + testPost.id)
                .expect(200);

        }).then(res => {
            const postTitle = res.body.post.title;
            expect(postTitle).to.equal('Test Post');

            return testPost.delete();

        }).then(() => {
            return testGroup.delete();
        });
    });

    it('should be able to create a new post', function () {
        const testGroup = new Group({
            name: 'Test Group'
        });

        return testGroup.create().then(() => {
            return request(app)
                .post('/new')
                .send({ groupId: testGroup.id, title: 'Post Title', text: 'Text of the post.' })
                .expect(201);

        }).then(res => {
            const postId = res.body.post.id;
            return Post.findById(postId);

        }).then(post => {
            expect(post.title).to.be.equal('Post Title');
            return post.delete();

        }).then(() => {
            return testGroup.delete();
        });
    });

    it('should be able to update an existing post', function () {
        const testGroup = new Group({
            name: 'Test Group'
        });

        let testPost: Post;
        return testGroup.create().then(() => {
            return User.findByEmail('john@bison.software');

        }).then(user => {
            testPost = new Post({
                userId: user.id!,
                groupId: testGroup.id!,
                title: 'Test Post',
                text: 'This post will be edited.'
            });
            return testPost.create();

        }).then(() => {
            return request(app)
                .put('/edit')
                .send({ postId: testPost.id, title: 'Updated Title', text: 'This post was updated.' })
                .expect(200);

        }).then(res => {
            const postId = res.body.post.id;
            return Post.findById(postId);

        }).then(post => {
            expect(post.title).to.be.equal('Updated Title');
            return post.delete();

        }).then(() => {
            return testGroup.delete();
        });
    });

    it('should be able to delete a post', function () {
        const testGroup = new Group({
            name: 'Test Group'
        });

        let testPost: Post;
        return testGroup.create().then(() => {
            return User.findByEmail('john@bison.software');

        }).then(user => {
            testPost = new Post({
                userId: user.id!,
                groupId: testGroup.id!,
                title: 'Test Post',
                text: 'This post will be deleted.'
            });
            return testPost.create();

        }).then(() => {
            return request(app)
                .delete('/delete')
                .send({ postId: testPost.id })
                .expect(200);

        }).then(() => {
            return testPost.isCreated();

        }).then(isCreated => {
            expect(isCreated).to.be.equal(false);
            return testGroup.delete();
        });
    });

    it('should be able to retrieve the messages of a post', function () {
        const testGroup = new Group({
            name: 'Test Group'
        });

        let currentUser: User;
        let testPost: Post;
        return testGroup.create().then(() => {
            return User.findByEmail('john@bison.software');

        }).then(user => {
            currentUser = user;
            testPost = new Post({
                userId: currentUser.id!,
                groupId: testGroup.id!,
                title: 'Test Post',
                text: 'This post will be edited.'
            });
            return testPost.create();

        }).then(() => {
            const message1 = new Message({
                userId: currentUser.id!,
                postId: testPost.id,
                content: 'Comment 1',
                type: ContentType.Text
            });
            const message2 = new Message({
                userId: currentUser.id!,
                postId: testPost.id,
                content: 'Comment 2',
                type: ContentType.Text
            });
            return Promise.all([message1.create(), message2.create()]);

        }).then(() => {
            return request(app)
                .get('/' + testPost.id + '/messages')
                .expect(200);

        }).then(res => {
            const messages = res.body.messages;
            expect(messages).to.have.lengthOf(2);

            return testPost.delete();

        }).then(() => {
            return testGroup.delete();
        });
    });

    it('should be able to comment on a post', function () {
        const testGroup = new Group({
            name: 'Test Group'
        });

        let currentUser: User;
        let testPost: Post;
        return testGroup.create().then(() => {
            return User.findByEmail('john@bison.software');

        }).then(user => {
            currentUser = user;
            testPost = new Post({
                userId: currentUser.id!,
                groupId: testGroup.id!,
                title: 'Test Post',
                text: 'This post will be edited.'
            });
            return testPost.create();

        }).then(() => {
            return request(app)
                .post('/add-message')
                .send({ postId: testPost.id, content: 'Comment on this post!', type: 'text' })
                .expect(201);

        }).then(res => {
            const message = res.body.message;
            expect(message.content).to.be.equal('Comment on this post!');

            return testPost.delete();

        }).then(() => {
            return testGroup.delete();
        });
    });

    it('should be able to delete a comment from a post', function () {
        const testGroup = new Group({
            name: 'Test Group'
        });

        let currentUser: User;
        let testPost: Post;
        let testComment: Message;
        return testGroup.create().then(() => {
            return User.findByEmail('john@bison.software');

        }).then(user => {
            currentUser = user;
            testPost = new Post({
                userId: currentUser.id!,
                groupId: testGroup.id!,
                title: 'Test Post',
                text: 'This post will be edited.'
            });
            return testPost.create();

        }).then(() => {
            testComment = new Message({
                userId: currentUser.id!,
                postId: testPost.id,
                content: 'Comment to be deleted',
                type: ContentType.Text
            });
            return testComment.create();

        }).then(() => {
            return request(app)
                .delete('/delete-message')
                .send({ messageId: testComment.id })
                .expect(200);

        }).then(res => {
            return testComment.isCreated();

        }).then(isCreated => {
            expect(isCreated).to.be.equal(false);
            return testPost.delete();

        }).then(() => {
            return testGroup.delete();
        });
    });
});