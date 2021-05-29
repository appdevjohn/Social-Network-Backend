import { ContentType, MessageType, getMessage, getMessagesFromConversation, getMessagesFromPost, createMessage, updateMessage, deleteMessage } from '../database/messages';

export interface MessageConfigType {
    userId: string,
    convoId?: string,
    postId?: string,
    content: string,
    type: ContentType
    id?: string;
}

class Message {
    userId: string;
    convoId?: string;
    postId?: string;
    content: string;
    type: ContentType;
    id?: string;

    constructor(config: MessageConfigType) {
        this.userId = config.userId;
        this.convoId = config.convoId;
        this.postId = config.postId;
        this.content = config.content;
        this.type = config.type;
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
                this.id = result.rows[0].id;
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

    static findById = (messageId: string): Promise<Message> => {
        return getMessage(messageId).then(result => {
            if (result.rowCount > 0) {
                return new Message({
                    userId: result.rows[0]['user_id'],
                    convoId: result.rows[0]['convo_id'],
                    postId: result.rows[0]['post_id'],
                    content: result.rows[0]['content'],
                    type: result.rows[0]['type'],
                    id: result.rows[0]['id']
                });
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
            id: row['id']
        });
    }
}

export default Message;