import {
    GroupType,
    getGroup,
    getGroupByName,
    getGroupsByUserId,
    createGroup,
    updateGroup,
    deleteGroup,
    addUserToGroup,
    removeUserFromGroup,
    getUsersInGroup,
} from '../database/group';
import { deletePostsFromGroup } from '../database/posts';
import User from './user';

export interface GroupConfigType {
    createdAt?: Date,
    updatedAt?: Date,
    name: string,
    id?: string
}

class Group {
    createdAt?: Date;
    updatedAt?: Date;
    name: string;
    id?: string;

    constructor(config: GroupConfigType) {
        this.createdAt = config.createdAt;
        this.updatedAt = config.updatedAt;
        this.name = config.name;
        this.id = config.id;
    }

    create(): Promise<boolean> {
        const newGroup: GroupType = {
            name: this.name
        }

        return createGroup(newGroup).then(result => {
            if (result.rowCount > 0) {
                this.createdAt = result.rows[0]['created_at'];
                this.updatedAt = result.rows[0]['updated_at'];
                this.id = result.rows[0]['group_id'];
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
            const updatedGroup: GroupType = {
                name: this.name
            }

            return updateGroup(this.id, updatedGroup).then(result => {
                if (result.rowCount > 0) {
                    this.updatedAt = result.rows[0]['updated_at'];
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
            return deleteGroup(this.id).then(() => {
                return deletePostsFromGroup(this.id!);

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
     * Finds out if this group exists in the database.
     * @returns Whether or not the group has been created in the database.
     */
    isCreated(): Promise<boolean> {
        if (this.id) {
            return getGroup(this.id).then(result => {
                return result.rowCount > 0;
            }).catch(() => {
                return false;
            });
        } else {
            return Promise.resolve(false);
        }
    }

    addUser(userId: string): Promise<boolean> {
        if (!this.id) {
            throw new Error('This group must be created in the database before users can be added.');
        }

        return addUserToGroup(userId, this.id).then(result => {
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
            throw new Error('This group must be created in the database before users can be removed.');
        }

        return removeUserFromGroup(userId, this.id).then(result => {
            if (result.rowCount > 0) {
                return getUsersInGroup(this.id!).then(usersInGroupResult => {
                    if (usersInGroupResult.rowCount === 0) {
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

    members(): Promise<User[]> {
        if (this.id) {
            return getUsersInGroup(this.id).then(usersInGroupResult => {
                const users = usersInGroupResult.rows.map(row => {
                    return User.parseRow(row);
                });
                return users;
            }).catch(error => {
                console.error(error);
                return [];
            });
        } else {
            return Promise.resolve([]);
        }
    }

    static findById = (groupId: string): Promise<Group> => {
        return getGroup(groupId).then(result => {
            if (result.rowCount > 0) {
                return new Group({
                    name: result.rows[0]['name'],
                    id: result.rows[0]['group_id']
                });
            } else {
                throw new Error('Could not find this conversation.');
            }
        }).catch(error => {
            throw new Error(error);
        });
    }

    static findByName = (name: string): Promise<Group> => {
        return getGroupByName(name).then(result => {
            if (result.rowCount > 0) {
                return new Group({
                    createdAt: result.rows[0]['created_at'],
                    updatedAt: result.rows[0]['updated_at'],
                    name: result.rows[0]['name'],
                    id: result.rows[0]['group_id']
                });
            } else {
                throw new Error('Could not find this grouop.');
            }
        }).catch(error => {
            throw new Error(error);
        });
    }

    static findByUserId = (userId: string): Promise<Group[]> => {
        return getGroupsByUserId(userId).then(result => {
            const rows = result.rows.filter(row => row['group_id'] !== null);
            const groups = rows.map(row => {
                return new Group({
                    createdAt: row['created_at'],
                    updatedAt: row['updated_at'],
                    name: row['name'],
                    id: row['group_id']
                });
            });
            return groups;
        }).catch(error => {
            throw new Error(error);
        });
    }
}

export default Group;