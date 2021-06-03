import { Request, Response, NextFunction } from 'express';

import RequestError from '../util/error';
import Conversation from '../models/conversation';
import Message from '../models/message';
import User from '../models/user';
import { ContentType } from '../database/messages';

export const canMessageUser = (req: Request, res: Response, next: NextFunction) => {
    const username = req.params.username;

    return User.findByUsername(username).then(() => {
        return res.status(200).json({
            username: username,
            valid: true
        });
    }).catch(() => {
        return res.status(200).json({
            username: username,
            valid: false
        });
    })
}

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

export const newConversation = (req: Request, res: Response, next: NextFunction) => {
    const convoName = req.body.convoName;
    const members: string[] = JSON.parse(req.body.members);

    const newConversation = new Conversation({
        name: convoName
    });

    return newConversation.create().then(success => {
        if (!success) {
            throw new Error('Something went wrong creating this conversation.');
        }

        const getUserPromises = members.map(member => {
            return User.findByUsername(member).catch(() => null);
        });
        getUserPromises.push(User.findById(req.userId!).catch(() => null));
        
        return Promise.all(getUserPromises);

    }).then(memberUsers => {
        const filteredMemberUsers: User[] = memberUsers.filter(member => member !== null) as User[];
        const addUserPromises = filteredMemberUsers.map(member => {
            return newConversation.addUser(member.id!);
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
        return next(RequestError.withMessageAndCode('Could not successfully create conversation.', 500));
    })
}

export const editConversation = (req: Request, res: Response, next: NextFunction) => {
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

export const leaveConversation = (req: Request, res: Response, next: NextFunction) => {
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
    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not leave conversation.', 500));
    });
}

export const newMessage = (req: Request, res: Response, next: NextFunction) => {
    const convoId: string | null = req.body.convoId || null;
    const postId: string | null = req.body.postId || null;
    const messageContent: string = req.body.content || '';
    const messageType: ContentType = req.body.type as ContentType;

    let message: Message;
    if (convoId) {
        message = new Message({
            userId: req.userId!,
            convoId: convoId,
            content: messageContent,
            type: messageType
        });
    } else if (postId) {
        message = new Message({
            userId: req.userId!,
            postId: postId,
            content: messageContent,
            type: messageType
        });
    } else {
        return next(RequestError.withMessageAndCode('A convoId or postId is required to send a new message.', 406));
    }

    return message.create().then(() => {
        return res.status(201).json({
            message: message
        })
    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not create message.', 500));
    });
}

export const deleteMessage = (req: Request, res: Response, next: NextFunction) => {
    const messageId = req.body.messageId;

    let message: Message;
    Message.findById(messageId).then(msg => {
        message = msg;
        return message.delete();

    }).then(success => {
        if (!success) {
            throw new Error('Unsuccessful deleting message.');
        }
        return res.status(200).json({
            message: message 
        });

    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not delete message.', 500));
    })
}