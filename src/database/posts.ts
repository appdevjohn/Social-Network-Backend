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
    return query('SELECT * FROM posts WHERE id = $1;', [postId]);
}

export const createPost = (newPost: PostType): Promise<QueryResult> => {
    return query('INSERT INTO posts (user_id, group_id, text, media) VALUES ($1, $2, $3, $4) RETURNING *', [newPost.userId, newPost.groupId, newPost.text, newPost.media]);
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

    queryString = queryString + ' WHERE id = $' + paramKeys.length + ' RETURNING *;';
    
    return query(queryString, paramKeys);
}

export const deletePost = (postId: string): Promise<QueryResult> => {
    return query('DELETE FROM posts WHERE id = $1 RETURNING *;', [postId]);
}