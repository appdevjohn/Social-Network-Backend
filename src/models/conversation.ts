import {
    ConversationType,
    getConversation,
    getConversationsByUserId,
    createConversation,
    updateConversation,
    deleteConversation,
    addUserToConversation,
    removeUserFromConversation,
    getUsersInConversation
} from '../database/conversation';

export interface ConversationConfigType {
    name: string,
    id?: string
}

class Conversation {
    name: string;
    id?: string;

    constructor(config: ConversationConfigType) {
        this.name = config.name;
    }

    create(): Promise<boolean> {
        const newConversation: ConversationType = {
            name: this.name
        }

        return createConversation(newConversation).then(result => {
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
            const updatedConversation: ConversationType = {
                name: this.name
            }

            return updateConversation(this.id, updatedConversation).then(result => {
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
            return deleteConversation(this.id).then(result => {
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

    addUser(userId: string): Promise<boolean> {
        if (!this.id) { 
            throw new Error('This conversation must be created in the database before users can be added.'); 
        }

        return addUserToConversation(userId, this.id).then(result => {
            if (result.rowCount > 0) {
                return true;
            } else {
                return false;
            }
        }).catch(error => {
            console.error(error);
            return false;
        });
    }

    removeUser(userId: string): Promise<boolean> {
        if (!this.id) { 
            throw new Error('This conversation must be created in the database before users can be removed.'); 
        }

        return removeUserFromConversation(userId, this.id).then(result => {
            if (result.rowCount > 0) {
                return getUsersInConversation(this.id!).then(usersInConversationResult => {
                    if (usersInConversationResult.rowCount === 0) {
                        return this.delete();
                    } else {
                        return Promise.resolve(true);
                    }
                }).then(() => {
                    return true;
                });

            } else {
                return false;
            }
        }).catch(error => {
            console.error(error);
            return false;
        });
    }

    static findById = (convoId: string): Promise<Conversation> => {
        return getConversation(convoId).then(result => {
            if (result.rowCount > 0) {
                return new Conversation({
                    name: result.rows[0]['name'],
                    id: result.rows[0]['id']
                });
            } else {
                throw new Error('Could not find this post.');
            }
        }).catch(error => {
            throw new Error(error);
        });
    }

    static findByUserId = (userId: string): Promise<Conversation[]> => {
        return getConversationsByUserId(userId).then(result => {
            const rows = result.rows.filter(row => row['id'] !== null);
            const conversations = rows.map(row => {
                return new Conversation({
                    name: row['name'],
                    id: row['id']
                });
            });
            return conversations;
        }).catch(error => {
            throw new Error(error);
        });
    }
}

export default Conversation;