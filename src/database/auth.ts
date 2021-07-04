import { QueryResult } from 'pg';
import query from './index';

export interface AccountType {
    firstName?: string,
    lastName?: string,
    username?: string,
    email?: string,
    hashedPassword?: string,
    activated?: boolean,
    activateToken?: string | null,
    socketId?: string | null
}

export const getUser = (userId: string): Promise<QueryResult> => {
    return query('SELECT * FROM users WHERE user_id = $1;', [userId]);
}

export const getUserByEmail = (email: string): Promise<QueryResult> => {
    return query('SELECT * FROM users WHERE email = $1;', [email]);
}

export const getUserByUsername = (username: string): Promise<QueryResult> => {
    return query('SELECT * FROM users WHERE username = $1;', [username]);
}

export const getUserBySocketId = (socketId: string): Promise<QueryResult> => {
    return query('SELECT * FROM users WHERE socket_id = $1;', [socketId]);
}

export const createUser = (newAccount: AccountType): Promise<QueryResult> => {
    return query('INSERT INTO users (first_name, last_name, username, email, hashed_password, activated, activate_token, socket_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;', [newAccount.firstName, newAccount.lastName, newAccount.username, newAccount.email, newAccount.hashedPassword, newAccount.activated, newAccount.activateToken, newAccount.socketId]);
}

export const updateUser = (userId: string, updatedAccount: AccountType): Promise<QueryResult> => {
    let queryString = 'UPDATE users SET';
    const paramKeys: (AccountType[keyof AccountType])[] = [];
    Object.keys(updatedAccount).forEach((key, index) => {
        paramKeys.push(updatedAccount[key as keyof AccountType]);

        if (index > 0) { queryString = queryString + ','; }
        switch (key) {
            case 'firstName':
                queryString = queryString + ' first_name = $' + (index + 1)
                break;
            case 'lastName':
                queryString = queryString + ' last_name = $' + (index + 1)
                break;
            case 'username':
                queryString = queryString + ' username = $' + (index + 1)
                break;
            case 'email':
                queryString = queryString + ' email = $' + (index + 1)
                break;
            case 'hashedPassword':
                queryString = queryString + ' hashed_password = $' + (index + 1)
                break;
            case 'activated':
                queryString = queryString + ' activated = $' + (index + 1)
                break;
            case 'activateToken':
                queryString = queryString + ' activate_token = $' + (index + 1)
                break;
            case 'socketId':
                queryString = queryString + ' socket_id = $' + (index + 1)
                break;
        
            default:
                break;
        }
    });
    paramKeys.push(userId);

    queryString = queryString + ' WHERE user_id = $' + paramKeys.length + ' RETURNING *;';
    
    return query(queryString, paramKeys);
}

export const deleteUser = (userId: string): Promise<QueryResult> => {
    return query('DELETE FROM users WHERE user_id = $1 RETURNING *;', [userId]);
}