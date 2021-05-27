import { PostType, getPost, createPost, updatePost, deletePost } from '../database/posts';

export interface PostConfigType {
    userId: string,
    groupId: string,
    title: string,
    text?: string,
    media?: string,
    id?: string
}

class Post {
    userId: string;
    groupId: string;
    title: string;
    text?: string;
    media?: string;
    id?: string;

    constructor(config: PostConfigType) {
        this.userId = config.userId;
        this.groupId = config.groupId;
        this.title = config.title;
        this.text = config.text;
        this.media = config.media;
        this.id = config.id;
    }

    create(): Promise<boolean> {
        const newPost: PostType = {
            userId: this.userId,
            groupId: this.groupId,
            title: this.title,
            text: this.text,
            media: this.media
        }

        return createPost(newPost).then(result => {
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
            const updatedPost: PostType = {
                userId: this.userId,
                groupId: this.groupId,
                title: this.title,
                text: this.text,
                media: this.media
            }

            return updatePost(this.id, updatedPost).then(result => {
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
            return deletePost(this.id).then(result => {
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

    static findById = (postId: string): Promise<Post> => {
        return getPost(postId).then(result => {
            if (result.rowCount > 0) {
                return new Post({
                    userId: result.rows[0]['user_id'],
                    groupId: result.rows[0]['group_id'],
                    title: result.rows[0]['title'],
                    text: result.rows[0]['text'],
                    media: result.rows[0]['media'],
                    id: result.rows[0]['id']
                });
            } else {
                throw new Error('Could not find this post.');
            }
        }).catch(error => {
            throw new Error(error);
        });
    }
}

export default Post;