import { Request, Response, NextFunction } from 'express';

import RequestError from '../util/error';
import Conversation from '../models/conversation';
import Message from '../models/message';
import User from '../models/user';

export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
    let conversations: Conversation[] = [];

    try {
        conversations = await Conversation.findByUserId(req.userId!);
    } catch (error) {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not retrieve conversations', 500));
    }
    
    return res.status(200).json({
        conversations: conversations
    });
}

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
    const convoId = req.params.convoId;

    let messages: Message[] = [];

    try {
        messages = await Message.findByConvoId(convoId);
    } catch (error) {
        return next(RequestError.withMessageAndCode('Could not retrieve messages.', 500));
    }

    return res.status(200).json({
        messages: messages
    });
}

export const getMessage = async (req: Request, res: Response, next: NextFunction) => {
    const messageId = req.params.messageId;

    try {
        const message = await Message.findById(messageId);
        return res.status(200).json({
            message: message
        });

    } catch (error) {
        return next(RequestError.withMessageAndCode('Could not retrieve message.', 500));
    }
}

export const postNewConversation = (req: Request, res: Response, next: NextFunction) => {
    const convoName = req.body.convoName;
    const members: string[] = req.body.members;

    const newConversation = new Conversation({
        name: convoName
    });

    return newConversation.create().then(success => {
        if (!success) {
            throw new Error('Something went wrong creating this conversation.');
        }

        const getUserPromises = members.map(member => {
            return User.findByEmail(member);
        });
        getUserPromises.push(User.findById(req.userId!));

        return Promise.all(getUserPromises);

    }).then(memberUsers => {
        const addUserPromises = memberUsers.map(memberUser => {
            return newConversation.addUser(memberUser.id!);
        });

        return Promise.all(addUserPromises);

    }).then(results => {
        if (results.includes(false)) {
            console.error('One or more members were not successfully added to the conversation.');
        }

        return res.status(201).json({
            conversation: newConversation
        });
    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not successfully create conversation.', 500));
    })
}

export const postEditConversation = (req: Request, res: Response, next: NextFunction) => {
    const convoId = req.body.convoId;
    const newConvoName = req.body.newConvoName;

    let conversation: Conversation;
    return Conversation.findById(convoId).then(convo => {
        conversation = convo;
        conversation.name = newConvoName;
        return conversation.update();

    }).then(success => {
        if (success) {
            return res.status(201).json({
                conversation: conversation
            });
        } else {
            return next(RequestError.withMessageAndCode('Could not update conversation.', 500));
        }

    }).catch(() => {
        return next(RequestError.withMessageAndCode('Could not update conversation.', 500));
    })
}

export const postLeaveConversation = (req: Request, res: Response, next: NextFunction) => {
    const convoId = req.body.convoId;

    let conversation: Conversation;
    return Conversation.findById(convoId).then(convo => {
        conversation = convo;
        return conversation.removeUser(req.userId!);
    }).then(success => {
        if (!success) {
            return next(RequestError.withMessageAndCode('Could not leave conversation.', 500));
        }

        return res.status(200).json({
            conversation: conversation
        });
    })
}

export const postNewMessage = (req: Request, res: Response, next: NextFunction) => {

}

export const postEditMessage = (req: Request, res: Response, next: NextFunction) => {

}

export const postDeleteMessage = (req: Request, res: Response, next: NextFunction) => {

}