import fs from 'fs';
import path from 'path';

import {
    ConversationType,
    getConversation,
    getConversationsByUserId,
    createConversation,
    updateConversation,
    deleteConversation,
    addUserToConversation,
    removeUserFromConversation,
    getUsersInConversation,
    getLastReadMessageId,
    updateLastReadMessageId
} from '../database/conversation';
import { deleteMessagesFromConversation, getAttachmentsFromConversation } from '../database/messages';
import User from './user';
import Message from './message';

export interface ConversationConfigType {
    createdAt?: Date,
    updatedAt?: Date,
    name: string,
    id?: string
}

class Conversation {
    createdAt?: Date;
    updatedAt?: Date;
    name: string;
    id?: string;

    constructor(config: ConversationConfigType) {
        this.createdAt = config.createdAt;
        this.updatedAt = config.updatedAt;
        this.name = config.name;
        this.id = config.id;
    }

    create(): Promise<boolean> {
        const newConversation: ConversationType = {
            name: this.name
        }

        return createConversation(newConversation).then(result => {
            if (result.rowCount > 0) {
                this.createdAt = result.rows[0]['created_at'];
                this.updatedAt = result.rows[0]['updated_at'];
                this.id = result.rows[0]['convo_id'];
                return true;
            } else {
                return false;
            }
        }).catch(error => {
            console.error(error);
            return false;
        });
    }

    update(): Promise<boolean> {
        if (this.id) {
            const updatedConversation: ConversationType = {
                name: this.name
            }

            return updateConversation(this.id, updatedConversation).then(result => {
                if (result.rowCount > 0) {
                    this.updatedAt = result.rows[0]['updated_at'];
                    return true;
                } else {
                    return false;
                }
            }).catch(error => {
                console.error(error);
                return false;
            });
        } else {
            return Promise.resolve(false);
        }
    }

    delete(): Promise<boolean> {
        if (this.id) {
            return deleteConversation(this.id).then(() => {
                return Message.findAttachmentsByConvoId(this.id!)

            }).then(attachments => {
                attachments.forEach(attachment => {
                    const filePath = path.join(__dirname, '..', '..', 'uploads', attachment.content);
                    fs.unlink(filePath, () => { console.log('File Deleted') });
                });
                return deleteMessagesFromConversation(this.id!);
                    
            }).then(() => {
                return true;

            }).catch(error => {
                console.error(error);
                return false;
            });
        } else {
            return Promise.resolve(false);
        }
    }

    /**
     * Finds out if this conversation exists in the database.
     * @returns Whether or not the conversation has been created in the database.
     */
    isCreated(): Promise<boolean> {
        if (this.id) {
            return getConversation(this.id).then(result => {
                return result.rowCount > 0;
            }).catch(() => {
                return false;
            });
        } else {
            return Promise.resolve(false);
        }
    }

    addUser(userId: string): Promise<boolean> {
        if (!this.id) {
            throw new Error('This conversation must be created in the database before users can be added.');
        }

        return addUserToConversation(userId, this.id).then(result => {
            if (result.rowCount > 0) {
                return true;
            } else {
                return false;
            }
        }).catch(error => {
            console.error(error);
            return false;
        });
    }

    removeUser(userId: string): Promise<boolean> {
        if (!this.id) {
            throw new Error('This conversation must be created in the database before users can be removed.');
        }

        return removeUserFromConversation(userId, this.id).then(result => {
            if (result.rowCount > 0) {
                return getUsersInConversation(this.id!).then(usersInConversationResult => {
                    if (usersInConversationResult.rowCount === 0) {
                        return this.delete();
                    } else {
                        return Promise.resolve(true);
                    }
                }).then(() => {
                    return true;
                });

            } else {
                return false;
            }
        }).catch(error => {
            console.error(error);
            return false;
        });
    }

    members(): Promise<User[]> {
        if (this.id) {
            return getUsersInConversation(this.id).then(usersInGroupResult => {
                const users = usersInGroupResult.rows.map(row => {
                    return User.parseRow(row);
                });
                return users;
            }).catch(error => {
                console.error(error);
                return [];
            });
        } else {
            return Promise.resolve([]);
        }
    }

    snippet(): Promise<Message | null> {
        if (this.id) {
            return Message.findByConvoId(this.id, 1).then(messages => {
                if (messages.length > 0) {
                    return messages[0];
                } else {
                    return null;
                }
            });
        } else {
            throw new Error('This conversation is not in the database.');
        }
    }

    getLastReadMessageId = (userId: string): Promise<string | null> => {
        if (this.id) {
            return Conversation.getLastReadMessageId(this.id, userId);
        } else {
            return Promise.resolve(null);
        }
    }

    updateLastReadMessage = (messageId: string, userId: string): Promise<string | null> => {
        if (this.id) {
            return Conversation.updateLastReadMessage(messageId, this.id, userId);
        } else {
            return Promise.resolve(null);
        }
    }

    static getLastReadMessageId = (convoId: string, userId: string): Promise<string | null> => {
        return getLastReadMessageId(convoId, userId).then(result => {
            if (result.rows.length > 0) {
                return result.rows[0]['last_read_message_id'];
            } else {
                return null;
            }
        });
    }

    static updateLastReadMessage = (messageId: string, convoId: string, userId: string): Promise<string | null> => {
        return updateLastReadMessageId(messageId, convoId, userId).then(result => {
            if (result.rows.length > 0) {
                return result.rows[0]['last_read_message_id'];
            } else {
                return null;
            }
        });
    }

    static findById = (convoId: string): Promise<Conversation> => {
        return getConversation(convoId).then(result => {
            if (result.rowCount > 0) {
                return new Conversation({
                    createdAt: result.rows[0]['created_at'],
                    updatedAt: result.rows[0]['updated_at'],
                    name: result.rows[0]['name'],
                    id: result.rows[0]['convo_id']
                });
            } else {
                throw new Error('Could not find this conversation.');
            }
        }).catch(error => {
            throw new Error(error);
        });
    }

    static findByUserId = (userId: string): Promise<Conversation[]> => {
        return getConversationsByUserId(userId).then(result => {
            const rows = result.rows.filter(row => row['convo_id'] !== null);
            const conversations = rows.map(row => {
                return new Conversation({
                    createdAt: row['created_at'],
                    updatedAt: row['updated_at'],
                    name: row['name'],
                    id: row['convo_id']
                });
            });
            return conversations;
        }).catch(error => {
            throw new Error(error);
        });
    }
}

export default Conversation;