import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

import Post from '../models/post';
import Message from '../models/message';
import RequestError from '../util/error';
import { ContentType } from '../database/messages';
import { getUploadURL } from '../util/upload';

export const getPosts = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const groupId: string = req.query.groupId as string;

    return Post.findByGroupId(groupId).then(posts => {
        return res.status(200).json({
            posts: posts
        });
    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not retrieve posts.', 500));
    });
}

export const getPost = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const postId: string = req.params.postId;

    return Post.findById(postId).then(post => {
        return Message.findByPostId(post.id!).then(messages => {
            messages.forEach(message => {
                if (message.type !== ContentType.Text) {
                    message.content = getUploadURL(message.content)!;
                }
            });

            return res.status(200).json({
                post: post,
                messages: messages
            });

        });
    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not retrieve posts.', 500));
    });
}

export const newPost = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const groupId: string = req.body.groupId;
    const title: string = req.body.title;
    const text: string = req.body.text;

    const post = new Post({
        userId: req.userId as string,
        groupId: groupId,
        title: title,
        text: text,
    });

    return post.create().then(success => {
        if (success) {
            return res.status(201).json({
                post: post
            });
        } else {
            return next(RequestError.withMessageAndCode('Could not create this post.', 500));
        }
    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not create this post.', 500));
    });
}

export const editPost = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const postId: string = req.body.postId;
    const newTitle: string = req.body.title;
    const newText: string = req.body.text;

    let updatedPost: Post;
    return Post.findById(postId).then(post => {
        updatedPost = post;
        updatedPost.title = newTitle;
        updatedPost.text = newText;
        return updatedPost.update();

    }).then(success => {
        if (success) {
            return res.status(200).json({
                post: updatedPost
            });
        } else {
            return next(RequestError.withMessageAndCode('Could not update this post.', 500));
        }
    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not update this post.', 500));
    });
}

export const deletePost = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const postId: string = req.params.postId;

    let deletedPost: Post;
    return Post.findById(postId).then(post => {
        deletedPost = post;
        return deletedPost.delete();
    }).then(success => {
        if (success) {
            return res.status(200).json({
                post: deletedPost
            });
        } else {
            return next(RequestError.withMessageAndCode('Could not delete this post.', 500));
        }
    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not delete this post', 500));
    });
}

export const getMessages = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const postId: string = req.params.postId;

    return Message.findByPostId(postId).then(messages => {
        messages.forEach(message => {
            if (message.type !== ContentType.Text) {
                message.content = getUploadURL(message.content)!;
            }
        });

        return res.status(200).json({
            messages: messages
        });

    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not retrieve messages for this post.', 500));
    })
}