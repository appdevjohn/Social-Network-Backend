import { ContentType, MessageType, getMessage, getMessagesFromConversation, getMessagesFromPost, createMessage, updateMessage, deleteMessage } from '../database/messages';

export interface MessageUserData {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
}

export interface MessageConfigType {
    userId: string;
    convoId?: string;
    postId?: string;
    content: string;
    type: ContentType;
    userData?: MessageUserData;
    id?: string;
}

class Message {
    userId: string;
    convoId?: string;
    postId?: string;
    content: string;
    type: ContentType;
    userData?: MessageUserData;
    id?: string;

    constructor(config: MessageConfigType) {
        this.userId = config.userId;
        this.convoId = config.convoId;
        this.postId = config.postId;
        this.content = config.content;
        this.type = config.type;
        this.userData = config.userData;
        this.id = config.id;
    }

    create(): Promise<boolean> {
        const newMessage: MessageType = {
            userId: this.userId,
            convoId: this.convoId,
            postId: this.postId,
            content: this.content,
            type: this.type
        }

        return createMessage(newMessage).then(result => {
            if (result.rowCount > 0) {
                this.id = result.rows[0]['message_id'];
                this.userData = {
                    firstName: result.rows[0]['first_name'],
                    lastName: result.rows[0]['last_name'],
                    email: result.rows[0]['email'],
                    username: result.rows[0]['username']
                }
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
            const updatedMessage: MessageType = {
                userId: this.userId,
                convoId: this.convoId,
                postId: this.postId,
                content: this.content,
                type: this.type
            }

            return updateMessage(this.id, updatedMessage).then(result => {
                if (result.rowCount > 0) {
                    this.userData = {
                        firstName: result.rows[0]['first_name'],
                        lastName: result.rows[0]['last_name'],
                        email: result.rows[0]['email'],
                        username: result.rows[0]['username']
                    }
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
            return deleteMessage(this.id).then(result => {
                if (result.rowCount > 0) {
                    this.userData = {
                        firstName: result.rows[0]['first_name'],
                        lastName: result.rows[0]['last_name'],
                        email: result.rows[0]['email'],
                        username: result.rows[0]['username']
                    }
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

    /**
     * Finds out if this message exists in the database.
     * @returns Whether or not the message has been created in the database.
     */
    isCreated(): Promise<boolean> {
        if (this.id) {
            return getMessage(this.id).then(result => {
                return result.rowCount > 0;
            }).catch(() => {
                return false;
            });
        } else {
            return Promise.resolve(false);
        }
    }

    static findById = (messageId: string): Promise<Message> => {
        return getMessage(messageId).then(result => {
            if (result.rowCount > 0) {
                return Message.parseRow(result.rows[0]);
            } else {
                throw new Error('Could not find this message.');
            }
        }).catch(error => {
            throw new Error(error);
        });
    }

    static findByConvoId = (convoId: string): Promise<Message[]> => {
        return getMessagesFromConversation(convoId).then(result => {
            const messages = result.rows.map(row => {
                return Message.parseRow(row);
            });
            return messages;
        }).catch(error => {
            throw new Error(error);
        });
    }

    static findByPostId = (postId: string): Promise<Message[]> => {
        return getMessagesFromPost(postId).then(result => {
            const messages = result.rows.map(row => {
                return Message.parseRow(row);
            });
            return messages;
        }).catch(error => {
            throw new Error(error);
        });
    }

    private static parseRow = (row: any): Message => {
        return new Message({
            userId: row['user_id'],
            convoId: row['convo_id'],
            postId: row['post_id'],
            content: row['content'],
            type: row['type'],
            userData: {
                firstName: row['first_name'],
                lastName: row['last_name'],
                email: row['email'],
                username: row['username']
            },
            id: row['message_id']
        });
    }
}

export default Message;