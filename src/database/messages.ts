import { Query, QueryResult } from 'pg';
import query from './index';

export enum ContentType {
    Text = 'text',
    Image = 'image'
}

export interface MessageType {
    userId?: string,
    convoId?: string,
    postId?: string,
    content?: string,
    type?: ContentType
}

export const getMessage = (messageId: string): Promise<QueryResult> => {
    return query('SELECT * FROM messages FULL JOIN users USING (user_id) WHERE messages.message_id = $1;', [messageId]);
}

export const getMessagesFromConversation = (convoId: string): Promise<QueryResult> => {
    return query('SELECT * FROM messages FULL JOIN users USING (user_id) WHERE messages.convo_id = $1;', [convoId]); 
}

export const getMessagesFromPost = (postId: string): Promise<QueryResult> => {
    return query('SELECT * FROM messages WHERE post_id = $1;', [postId]); 
}

export const createMessage = (newMessage: MessageType): Promise<QueryResult> => {
    return query('INSERT INTO messages (user_id, convo_id, post_id, content, type) VALUES ($1, $2, $3, $4, $5) RETURNING *', [newMessage.userId, newMessage.convoId, newMessage.postId, newMessage.content, newMessage.type]);
}

export const updateMessage = (messageId: string, updatedMessage: MessageType): Promise<QueryResult> => {
    let queryString = 'UPDATE messages SET';
    const paramKeys: (MessageType[keyof MessageType])[] = [];
    Object.keys(updatedMessage).forEach((key, index) => {
        paramKeys.push(updatedMessage[key as keyof MessageType]);

        if (index > 0) { queryString = queryString + ','; }
        switch (key) {
            case 'userId':
                queryString = queryString + ' user_id = $' + (index + 1)
                break;
            case 'convoId':
                queryString = queryString + ' convo_id = $' + (index + 1)
                break;
            case 'postId':
                queryString = queryString + ' post_id = $' + (index + 1)
                break;
            case 'content':
                queryString = queryString + ' content = $' + (index + 1)
                break;
            case 'type':
                queryString = queryString + ' type = $' + (index + 1)
                break;

            default:
                break;
        }
    });
    paramKeys.push(messageId);

    queryString = queryString + ' WHERE message_id = $' + paramKeys.length + ' RETURNING *;';
    
    return query(queryString, paramKeys);
}

export const deleteMessage = (messageId: string): Promise<QueryResult> => {
    return query('DELETE FROM messages WHERE message_id = $1 RETURNING *;', [messageId]);
}

export const deleteMessagesFromConversation = (convoId: string): Promise<QueryResult> => {
    return query('DELETE FROM messages WHERE convo_id = $1 RETURNING *;', [convoId]);
}

export const deleteMessagesFromPost = (postId: string): Promise<QueryResult> => {
    return query('DELETE FROM messages WHERE post_id = $1 RETURNING *;', [postId]);
}