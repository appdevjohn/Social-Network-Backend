import { QueryResult } from 'pg';
import query from './index';

export interface PostType {
    userId?: string,
    groupId?: string,
    title?: string,
    text?: string,
    media?: string
}

export const getPost = (postId: string): Promise<QueryResult> => {
    return query('SELECT posts.*, users.first_name, users.last_name, users.username, users.email, users.profile_pic_url FROM posts FULL JOIN users USING (user_id) WHERE posts.post_id = $1;', [postId]);
}

export const getPostsFromGroup = (groupId: string, limit?: number, offset: number = 0): Promise<QueryResult> => {
    if (limit) {
        return query('SELECT posts.*, users.first_name, users.last_name, users.username, users.email, users.profile_pic_url FROM posts FULL JOIN users USING (user_id) WHERE posts.group_id = $1 LIMIT $2 OFFSET $3;', [groupId, `${limit}`, `${offset}`]);
    } else {
        return query('SELECT posts.*, users.first_name, users.last_name, users.username, users.email, users.profile_pic_url FROM posts FULL JOIN users USING (user_id) WHERE posts.group_id = $1 OFFSET $2;', [groupId, `${offset}`]);
    }
}

export const createPost = (newPost: PostType): Promise<QueryResult> => {
    return query('INSERT INTO posts (user_id, group_id, title, text, media) VALUES ($1, $2, $3, $4, $5) RETURNING *', [newPost.userId, newPost.groupId, newPost.title, newPost.text, newPost.media]);
}

export const updatePost = (postId: string, updatedPost: PostType): Promise<QueryResult> => {
    let queryString = 'UPDATE posts SET';
    const paramKeys: (PostType[keyof PostType])[] = [];
    Object.keys(updatedPost).forEach((key, index) => {
        paramKeys.push(updatedPost[key as keyof PostType]);

        if (index > 0) { queryString = queryString + ','; }
        switch (key) {
            case 'userId':
                queryString = queryString + ' user_id = $' + (index + 1)
                break;
            case 'groupId':
                queryString = queryString + ' group_id = $' + (index + 1)
                break;
            case 'title':
                queryString = queryString + ' title = $' + (index + 1)
                break;
            case 'text':
                queryString = queryString + ' text = $' + (index + 1)
                break;
            case 'media':
                queryString = queryString + ' media = $' + (index + 1)
                break;

            default:
                break;
        }
    });
    paramKeys.push(postId);

    queryString = queryString + ' WHERE post_id = $' + paramKeys.length + ' RETURNING *;';
    
    return query(queryString, paramKeys);
}

export const deletePost = (postId: string): Promise<QueryResult> => {
    return query('DELETE FROM posts WHERE post_id = $1 RETURNING *;', [postId]);
}

export const deletePostsFromGroup = (groupId: string): Promise<QueryResult> => {
    return query('DELETE FROM posts WHERE group_id = $1 RETURNING *;', [groupId]);
}