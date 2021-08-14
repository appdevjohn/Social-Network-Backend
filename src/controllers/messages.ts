import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

import { updateConversation } from '../util/io';
import RequestError from '../util/error';
import Conversation from '../models/conversation';
import Message from '../models/message';
import User from '../models/user';
import { ContentType } from '../database/messages';
import { uploadPrefix } from '../util/upload';

export const canMessageUser = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: errors.array()[0].msg,
            errors: errors.array() 
        });
    }

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
    let conversationResponse: any[] = [];

    try {
        const conversations = await Conversation.findByUserId(req.userId!);

        for await (const conversation of conversations) {
            const snippet = await conversation.snippet();
            const lastReadMessageId = await conversation.getLastReadMessageId(req.userId!);
            const convo = {
                ...conversation,
                lastReadMessageId: lastReadMessageId,
                snippet: snippet
            }
            conversationResponse.push(convo);
        }
    } catch (error) {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not retrieve conversations', 500));
    }
    
    return res.status(200).json({
        conversations: conversationResponse
    });
}

export const getConversation = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: errors.array()[0].msg,
            errors: errors.array() 
        });
    }

    const convoId = req.params.convoId;
    const limit = parseInt(req.query.limit as string) || 256;
    const offset = parseInt(req.query.offset as string) || 0;

    let conversation: Conversation;
    let members: User[];
    let lastReadMessageId: string | null = null;
    return Conversation.findById(convoId).then(convo => {
        conversation = convo;
        return conversation.getLastReadMessageId(req.userId!);

    }).then(lastReadId => {
        lastReadMessageId = lastReadId;
        return conversation.members();

    }).then(users => {
        members = users;
        return Message.findByConvoId(conversation.id!, limit, offset);

    }).then(messages => {
        messages.forEach(message => {
            if (message.type !== ContentType.Text) {
                message.content = uploadPrefix + message.content;
            }
        })

        return res.status(200).json({
            conversation: {
                ...conversation,
                lastReadMessageId: lastReadMessageId
            },
            members: members.map(member => {
                return {
                    id: member.id,
                    firstName: member.firstName,
                    lastName: member.lastName,
                    username: member.username,
                    email: member.email,
                    profilePicURL: uploadPrefix + member.profilePicURL
                }
            }),
            messages: messages
        });

    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not find conversation.', 404));
    })
}

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: errors.array()[0].msg,
            errors: errors.array() 
        });
    }

    const convoId = req.params.convoId;
    const limit = parseInt(req.query.limit as string) || 256;
    const offset = parseInt(req.query.startAt as string) || 0;

    let messages: Message[];

    try {
        messages = await Message.findByConvoId(convoId, limit, offset);
        messages.forEach(message => {
            if (message.type !== ContentType.Text) {
                message.content = uploadPrefix + message.content;
            }
        });

    } catch (error) {
        return next(RequestError.withMessageAndCode('Could not retrieve messages.', 500));
    }

    return res.status(200).json({
        messages: messages
    });
}

export const getMessage = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: errors.array()[0].msg,
            errors: errors.array() 
        });
    }

    const messageId = req.params.messageId;

    try {
        const message = await Message.findById(messageId);
        if (message.type !== ContentType.Text) {
            message.content = uploadPrefix + message.content;
        }

        return res.status(200).json({
            message: message
        });

    } catch (error) {
        return next(RequestError.withMessageAndCode('Could not retrieve message.', 500));
    }
}

export const newConversation = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: errors.array()[0].msg,
            errors: errors.array() 
        });
    }

    const convoName = req.body.name;
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

        return newConversation.members();

    }).then(members => {
        return res.status(201).json({
            conversation: newConversation,
            members: members.map(member => {
                return {
                    id: member.id,
                    firstName: member.firstName,
                    lastName: member.lastName,
                    username: member.username,
                    email: member.email,
                    profilePicURL: uploadPrefix + member.profilePicURL
                }
            })
        });

    }).catch(error => {
        return next(RequestError.withMessageAndCode('Could not successfully create conversation.', 500));
    })
}

export const editConversation = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: errors.array()[0].msg,
            errors: errors.array() 
        });
    }

    const convoId = req.body.convoId;
    const newConvoName = req.body.newName;

    let conversation: Conversation;
    return Conversation.findById(convoId).then(convo => {
        conversation = convo;
        conversation.name = newConvoName;
        return conversation.update();

    }).then(success => {
        if (success) {
            return conversation.members().then(members => {
                return res.status(200).json({
                    conversation: conversation,
                    members: members.map(member => {
                        return {
                            id: member.id,
                            firstName: member.firstName,
                            lastName: member.lastName,
                            username: member.username,
                            email: member.email,
                            profilePicURL: uploadPrefix + member.profilePicURL
                        }
                    })
                });
            }).catch(error => {
                console.error(error);
                return next(RequestError.withMessageAndCode('There was an error retrieving this conversation\'s data.', 500));
            });
            
        } else {
            return next(RequestError.withMessageAndCode('Could not update conversation.', 500));
        }

    }).catch(() => {
        return next(RequestError.withMessageAndCode('Could not update conversation.', 500));
    })
}

export const leaveConversation = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: errors.array()[0].msg,
            errors: errors.array() 
        });
    }

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: errors.array()[0].msg,
            errors: errors.array() 
        });
    }

    const convoId: string | null = req.body.convoId || null;
    const postId: string | null = req.body.postId || null;
    const messageContent: string = req.body.content || '';
    const filename: string | null = req.file ? req.file.filename : null;

    let message: Message;
    if (convoId) {
        message = new Message({
            userId: req.userId!,
            convoId: convoId,
            content: messageContent,
            type: ContentType.Text
        });
    } else if (postId) {
        message = new Message({
            userId: req.userId!,
            postId: postId,
            content: messageContent,
            type: ContentType.Text
        });
    } else {
        return next(RequestError.withMessageAndCode('A convoId or postId is required to send a new message.', 406));
    }

    if (filename) {
        message.content = filename;
        message.type = ContentType.Image;
    }

    return message.create().then(() => {
        if (message.type !== ContentType.Text) {
            message.content = uploadPrefix + message.content;
        }

        res.status(201).json({
            message: message
        });
        
        if (convoId) {
            updateConversation(convoId, message);
        }
    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not create message.', 500));
    });
}

export const deleteMessage = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: errors.array()[0].msg,
            errors: errors.array() 
        });
    }

    const messageId = req.body.messageId;

    let message: Message;
    Message.findById(messageId).then(msg => {
        message = msg;

        if (message.type !== ContentType.Text) {
            const filePath = path.join(__dirname, '..', '..', 'uploads', message.content);
            fs.unlink(filePath, () => { console.log('Image Deleted') });
        }
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

export const updateLastReadMessageOfConversation = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: errors.array()[0].msg,
            errors: errors.array() 
        });
    }

    const convoId = req.body.convoId;
    const messageId = req.body.messageId;

    return Conversation.updateLastReadMessage(messageId, convoId, req.userId!).then(result => {
        if (result) {
            return res.status(200).json({
                messageId: result
            })
        } else {
            return next(RequestError.withMessageAndCode('Last read message could not be saved.', 409));
        }
    });
}