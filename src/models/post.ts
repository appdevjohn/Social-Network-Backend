import {
    PostType,
    getPost,
    createPost,
    updatePost,
    deletePost,
    getPostsFromGroup
} from '../database/posts';
import { deleteMessagesFromPost } from '../database/messages';

export interface PostUserData {
    firstName: string,
    lastName: string,
    email: string;
    username: string;
}

export interface PostConfigType {
    userId: string,
    groupId: string,
    title: string,
    text?: string,
    media?: string,
    userData?: PostUserData,
    id?: string
}

class Post {
    userId: string;
    groupId: string;
    title: string;
    text?: string;
    media?: string;
    userData?: PostUserData;
    id?: string;

    constructor(config: PostConfigType) {
        this.userId = config.userId;
        this.groupId = config.groupId;
        this.title = config.title;
        this.text = config.text;
        this.media = config.media;
        this.userData = config.userData;
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
                this.id = result.rows[0]['post_id'];
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
            const updatedPost: PostType = {
                userId: this.userId,
                groupId: this.groupId,
                title: this.title,
                text: this.text,
                media: this.media
            }

            return updatePost(this.id, updatedPost).then(result => {
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
            return deletePost(this.id).then(result => {
                if (result.rowCount > 0) {
                    this.userData = {
                        firstName: result.rows[0]['first_name'],
                        lastName: result.rows[0]['last_name'],
                        email: result.rows[0]['email'],
                        username: result.rows[0]['username']
                    }
                }
                return deleteMessagesFromPost(this.id!);

            }).then(() => {
                return true;

            }).catch(error => {
                console.error(error);
                return false;
            });
        } else {
            return Promise.resolve(false);
        }
    }

    /**
     * Finds out if this post exists in the database.
     * @returns Whether or not the post has been created in the database.
     */
    isCreated(): Promise<boolean> {
        if (this.id) {
            return getPost(this.id).then(result => {
                return result.rowCount > 0;
            }).catch(() => {
                return false;
            });
        } else {
            return Promise.resolve(false);
        }
    }

    static findById = (postId: string): Promise<Post> => {
        return getPost(postId).then(result => {
            if (result.rowCount > 0) {
                return Post.parseRow(result.rows[0]);
            } else {
                throw new Error('Could not find this post.');
            }
        }).catch(error => {
            throw new Error(error);
        });
    }

    static findByGroupId = (groupId: string): Promise<Post[]> => {
        return getPostsFromGroup(groupId).then(result => {
            const posts = result.rows.map(row => {
                return Post.parseRow(row);
            });
            return posts;
        }).catch(error => {
            throw new Error(error);
        });
    }

    private static parseRow = (row: any): Post => {
        return new Post({
            userId: row['user_id'],
            groupId: row['group_id'],
            title: row['title'],
            text: row['text'],
            media: row['media'],
            userData: {
                firstName: row['first_name'],
                lastName: row['last_name'],
                email: row['email'],
                username: row['username']
            },
            id: row['post_id']
        });
    }
}

export default Post;