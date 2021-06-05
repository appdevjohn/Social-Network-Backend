import { QueryResult } from 'pg';
import query from './index';

export interface GroupType {
    name?: string
}

export const getGroup = (groupId: string): Promise<QueryResult> => {
    return query('SELECT * FROM groups WHERE group_id = $1;', [groupId]);
}

export const getGroupByName = (name: string): Promise<QueryResult> => {
    return query('SELECT * FROM groups WHERE name = $1;', [name]);
}

export const getGroupsByUserId = (userId: string): Promise<QueryResult> => {
    return query('SELECT DISTINCT groups.* FROM users FULL JOIN users_groups USING (user_id) FULL JOIN groups USING (group_id) WHERE users.user_id = $1;', [userId]);
}

export const createGroup = (newGroup: GroupType): Promise<QueryResult> => {
    return query('INSERT INTO groups (name) VALUES ($1) RETURNING *', [newGroup.name]);
}

export const updateGroup = (groupId: string, updatedGroup: GroupType): Promise<QueryResult> => {
    let queryString = 'UPDATE groups SET';
    const paramKeys: (GroupType[keyof GroupType])[] = [];
    Object.keys(updatedGroup).forEach((key, index) => {
        paramKeys.push(updatedGroup[key as keyof GroupType]);

        if (index > 0) { queryString = queryString + ','; }
        switch (key) {
            case 'name':
                queryString = queryString + ' name = $' + (index + 1)
                break;

            default:
                break;
        }
    });
    paramKeys.push(groupId);

    queryString = queryString + ' WHERE group_id = $' + paramKeys.length + ' RETURNING *;';
    
    return query(queryString, paramKeys);
}

export const deleteGroup = (groupId: string): Promise<QueryResult> => {
    return query('DELETE FROM groups WHERE group_id = $1 RETURNING *;', [groupId]);
}

export const addUserToGroup = (userId: string, groupId: string): Promise<QueryResult> => {
    return query('INSERT INTO users_groups (user_id, group_id) VALUES ($1, $2) RETURNING *;', [userId, groupId]);
}

export const removeUserFromGroup = (userId: string, groupId: string): Promise<QueryResult> => {
    return query('DELETE FROM users_groups WHERE user_id = $1 AND group_id = $2 RETURNING *;', [userId, groupId]);
}

export const getUsersInGroup = (groupId: string): Promise<QueryResult> => {
    return query('SELECT user_id FROM users_groups WHERE group_id = $1', [groupId]);
}