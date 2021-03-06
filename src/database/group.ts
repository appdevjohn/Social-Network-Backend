import { Query, QueryResult } from 'pg';
import query from './index';

export interface GroupType {
    name?: string;
    description?: string;
}

export const getGroup = (groupId: string, userId?: string): Promise<QueryResult> => {
    if (userId) {
        return query('SELECT DISTINCT groups.*, users_groups.admin_status, users_groups.approved FROM groups LEFT JOIN users_groups ON users_groups.user_id = $1 WHERE groups.group_id = $2;', [userId, groupId]);
    } else {
        return query('SELECT * FROM groups WHERE group_id = $1;', [groupId]);
    }
}

export const getGroupByName = (name: string, userId?: string): Promise<QueryResult> => {
    if (userId) {
        return query('SELECT DISTINCT groups.*, users_groups.admin_status, users_groups.approved FROM groups LEFT JOIN users_groups ON users_groups.user_id = $1 WHERE groups.name = $2;', [userId, name]);
    } else {
        return query('SELECT * FROM groups WHERE name = $1;', [name]);
    }
}

export const getGroupsByUserId = (userId: string): Promise<QueryResult> => {
    return query('SELECT DISTINCT groups.*, users_groups.admin_status, users_groups.approved FROM users FULL JOIN users_groups USING (user_id) FULL JOIN groups USING (group_id) WHERE users.user_id = $1;', [userId]);
}

export const getGroupsByNameLike = (name: string, limit: number = 20, userId?: string): Promise<QueryResult> => {
    const nameLike = `%${name.toLowerCase()}%`;

    if (userId) {
        return query('SELECT DISTINCT groups.*, users_groups.admin_status, users_groups.approved FROM groups LEFT JOIN users_groups ON users_groups.user_id = $1 WHERE LOWER(name) LIKE $2 LIMIT $3;', [userId, nameLike, `${limit}`]);
    } else {
        return query('SELECT * FROM groups WHERE LOWER(name) LIKE $1 LIMIT $2;', [nameLike, `${limit}`]);
    }
}

export const createGroup = (newGroup: GroupType): Promise<QueryResult> => {
    return query('INSERT INTO groups (name, description) VALUES ($1, $2) RETURNING *', [newGroup.name, newGroup.description]);
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
            case 'description':
                queryString = queryString + ' description = $' + (index + 1)
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
    return query('DELETE FROM users_groups WHERE group_id = $1;', [groupId]).then(() => {
        return query('DELETE FROM groups WHERE group_id = $1 RETURNING *;', [groupId]);
    });
}

export const addUserToGroup = (userId: string, groupId: string, approved: boolean, admin: boolean): Promise<QueryResult> => {
    return query('INSERT INTO users_groups (user_id, group_id, approved, admin_status) VALUES ($1, $2, $3, $4) RETURNING *;', [userId, groupId, approved, admin]);
}

export const approveUserInGroup = (userId: string, groupId: string): Promise<QueryResult> => {
    return query('UPDATE users_groups SET approved = true WHERE user_id = $1 AND group_id = $2 RETURNING *;', [userId, groupId]);
}

export const removeUserFromGroup = (userId: string, groupId: string): Promise<QueryResult> => {
    return query('DELETE FROM users_groups WHERE user_id = $1 AND group_id = $2 RETURNING *;', [userId, groupId]);
}

export const setAdminStatus = (userId: string, groupId: string, admin: boolean) => {
    return query('UPDATE users_groups SET admin_status = $1, approved = true WHERE user_id = $2 and group_id = $3 RETURNING *;', [admin, userId, groupId]);
}

export const getUsersRequestingApproval = (groupId: string): Promise<QueryResult> => {
    return query('SELECT users.* FROM users_groups RIGHT JOIN users USING (user_id) WHERE group_id = $1 AND approved = false;', [groupId]);
}

export const getAdminsInGroup = (groupId: string) => {
    return query('SELECT * FROM users_groups RIGHT JOIN users USING (user_id) WHERE group_id = $1 AND approved = true AND admin_status = true;', [groupId]);
}

export const getUsersInGroup = (groupId: string): Promise<QueryResult> => {
    return query('SELECT users.*, users_groups.admin_status, users_groups.approved FROM users_groups RIGHT JOIN users USING (user_id) WHERE group_id = $1 AND approved = true;', [groupId]);
}

export const getAdminCountForGroup = (groupId: string) => {
    return query('SELECT COUNT(*) FROM users_groups WHERE group_id = $1 AND admin_status = true;', [groupId]);
}

export const getAdminStatusOfUserForGroup = (groupId: string, userId: string) => {
    return query('SELECT COUNT(*) FROM users_groups WHERE group_id = $1 AND user_id = $2 AND admin_status = true;', [groupId, userId]);
}

export const getMemberStatusOfUserForGroup = (groupId: string, userId: string) => {
    return query('SELECT COUNT(*) FROM users_groups WHERE group_id = $1 AND user_id = $2 AND approved = true;', [groupId, userId]);
}