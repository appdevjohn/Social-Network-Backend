import { QueryResult } from 'pg';
import query from './index';

export interface ConversationType {
    name?: string
}

export const getConversation = (convoId: string): Promise<QueryResult> => {
    return query('SELECT * FROM conversations WHERE convo_id = $1;', [convoId]);
}

export const getConversationsByUserId = (userId: string): Promise<QueryResult> => {
    return query('SELECT DISTINCT conversations.* FROM users FULL JOIN users_conversations USING (user_id) FULL JOIN conversations USING (convo_id) WHERE users.user_id = $1;', [userId]);
}

export const createConversation = (newConversation: ConversationType): Promise<QueryResult> => {
    return query('INSERT INTO conversations (name) VALUES ($1) RETURNING *', [newConversation.name]);
}

export const updateConversation = (convoId: string, updatedConversation: ConversationType): Promise<QueryResult> => {
    let queryString = 'UPDATE conversations SET';
    const paramKeys: (ConversationType[keyof ConversationType])[] = [];
    Object.keys(updatedConversation).forEach((key, index) => {
        paramKeys.push(updatedConversation[key as keyof ConversationType]);

        if (index > 0) { queryString = queryString + ','; }
        switch (key) {
            case 'name':
                queryString = queryString + ' name = $' + (index + 1)
                break;

            default:
                break;
        }
    });
    paramKeys.push(convoId);

    queryString = queryString + ' WHERE convo_id = $' + paramKeys.length + ' RETURNING *;';
    
    return query(queryString, paramKeys);
}

export const deleteConversation = (convoId: string): Promise<QueryResult> => {
    return query('DELETE FROM conversations WHERE convo_id = $1 RETURNING *;', [convoId]);
}

export const addUserToConversation = (userId: string, convoId: string): Promise<QueryResult> => {
    return query('INSERT INTO users_conversations (user_id, convo_id) VALUES ($1, $2) RETURNING *;', [userId, convoId]);
}

export const removeUserFromConversation = (userId: string, convoId: string): Promise<QueryResult> => {
    return query('DELETE FROM users_conversations WHERE user_id = $1 AND convo_id = $2 RETURNING *;', [userId, convoId]);
}

export const getUsersInConversation = (convoId: string): Promise<QueryResult> => {
    return query('SELECT * FROM users_conversations RIGHT JOIN users USING (user_id) WHERE convo_id = $1', [convoId]);
}