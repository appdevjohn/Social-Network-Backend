import { Request, Response, NextFunction } from 'express';

import Post from '../models/post';
import RequestError from '../util/error';

const isPostOwner = async (postId: string, req: Request, res: Response, next: NextFunction) => {
    const post = await Post.findById(postId);

    if (req.userId !== post.userId) {
        req.ownerPostId = null;
        throw RequestError.notPostOwner();
    } else {
        req.ownerPostId = postId;
        return;
    }
}

export default isPostOwner;