import { Request, Response, NextFunction } from 'express';
import Message from '../models/message';

import Post from '../models/post';
import RequestError from '../util/error';

const isMessageOwner = async (messageId: string, req: Request, res: Response, next: NextFunction) => {
    const message = await Message.findById(messageId)

    if (req.userId !== message.userId) {
        req.ownerMessageId = null;
        throw RequestError.notMessageOwner();
    } else {
        req.ownerMessageId = messageId;
        return;
    }
}

export default isMessageOwner;