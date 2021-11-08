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
    approveUserInGroup,
    getUsersRequestingApproval,
    setAdminStatus,
    getAdminsInGroup
} from '../database/group';
import { deletePostsFromGroup } from '../database/posts';
import User from './user';

export interface GroupConfigType {
    createdAt?: Date,
    updatedAt?: Date,
    name: string,
    description: string,
    approved?: boolean,
    admin?: boolean,
    id?: string
}

class Group {
    createdAt?: Date;
    updatedAt?: Date;
    name: string;
    description: string;
    approved?: boolean;
    admin?: boolean;
    id?: string;

    constructor(config: GroupConfigType) {
        this.createdAt = config.createdAt;
        this.updatedAt = config.updatedAt;
        this.name = config.name;
        this.description = config.description;
        this.id = config.id;

        if (config.approved) {
            this.approved = config.approved;
        }
        if (config.admin) {
            this.admin = config.admin;
        }
    }

    create(): Promise<void> {
        const newGroup: GroupType = {
            name: this.name,
            description: this.description
        }

        return createGroup(newGroup).then(result => {
            this.createdAt = result.rows[0]['created_at'];
            this.updatedAt = result.rows[0]['updated_at'];
            this.id = result.rows[0]['group_id'];
        });
    }

    update(): Promise<void> {
        if (this.id) {
            const updatedGroup: GroupType = {
                name: this.name,
                description: this.description
            }

            return updateGroup(this.id, updatedGroup).then(result => {
                this.updatedAt = result.rows[0]['updated_at'];
            });

        } else {
            throw new Error('This group has not yet been created.');
        }
    }

    delete(): Promise<void> {
        if (this.id) {
            return deleteGroup(this.id).then(() => {
                return deletePostsFromGroup(this.id!);
            }).then(() => { return });

        } else {
            throw new Error('This group has not yet been created.');
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

    addUser(userId: string, approved: boolean, admin: boolean): Promise<void> {
        if (!this.id) {
            throw new Error('This group must be created in the database before users can be added.');
        }

        return addUserToGroup(userId, this.id, approved, admin).then(result => {
            if (result.rowCount > 0) {
                return;
            } else {
                throw new Error('Something went wrong adding this user to a group.');
            }
        });
    }

    removeUser(userId: string): Promise<void> {
        if (!this.id) {
            throw new Error('This group must be created in the database before users can be removed.');
        }

        return removeUserFromGroup(userId, this.id).then(result => {
            if (result.rowCount > 0) {
                return getUsersInGroup(this.id!).then(usersInGroupResult => {
                    if (usersInGroupResult.rowCount === 0) {
                        return this.delete();
                    } else {
                        return Promise.resolve();
                    }
                });

            } else {
                throw new Error('Something went wrong removing this user from the group.');
            }
        });
    }

    approveUser(userId: string): Promise<void> {
        if (!this.id) {
            throw new Error('This group must be created in the database before users can be approved.');
        }

        return approveUserInGroup(userId, this.id).then(result => {
            if (result.rowCount > 0) {
                return;
            } else {
                throw new Error('Something went wrong approving this user for a group.');
            }
        });
    }

    setAdmin(userId: string, adminStatus: boolean): Promise<void> {
        if (!this.id) {
            throw new Error('This group must be created in the database admins can be set.');
        }

        return setAdminStatus(userId, this.id, adminStatus).then(adminStatusResult => {
            if (adminStatusResult.rowCount > 0) {
                return;
            } else {
                throw new Error('The user must be a member of the group to set the admin status.');
            }
        });
    }

    requests(): Promise<User[]> {
        if (!this.id) {
            throw new Error('This group must be created in the database before requests can be queried.');
        }

        return getUsersRequestingApproval(this.id).then(usersRequestingApprovalResult => {
            const users = usersRequestingApprovalResult.rows.map(row => {
                return User.parseRow(row);
            });
            return users;
        });
    }

    admins(): Promise<User[]> {
        if (!this.id) {
            throw new Error('This group must be created in the database before members can be queried.');
        }

        return getAdminsInGroup(this.id).then(adminsInGroupResult => {
            const users = adminsInGroupResult.rows.map(row => {
                return User.parseRow(row);
            });
            return users;
        });
    }

    members(): Promise<User[]> {
        if (!this.id) {
            throw new Error('This group must be created in the database before members can be queried.');
        }

        return getUsersInGroup(this.id).then(usersInGroupResult => {
            const users = usersInGroupResult.rows.map(row => {
                return User.parseRow(row);
            });
            return users;
        });
    }

    static findById = (groupId: string): Promise<Group> => {
        return getGroup(groupId).then(result => {
            if (result.rowCount > 0) {
                return new Group({
                    createdAt: result.rows[0]['created_at'],
                    updatedAt: result.rows[0]['updated_at'],
                    name: result.rows[0]['name'],
                    description: result.rows[0]['description'],
                    id: result.rows[0]['group_id']
                });
            } else {
                throw new Error('Could not find this conversation.');
            }
        });
    }

    static findByName = (name: string): Promise<Group> => {
        return getGroupByName(name).then(result => {
            if (result.rowCount > 0) {
                return new Group({
                    createdAt: result.rows[0]['created_at'],
                    updatedAt: result.rows[0]['updated_at'],
                    name: result.rows[0]['name'],
                    description: result.rows[0]['description'],
                    id: result.rows[0]['group_id']
                });
            } else {
                throw new Error('Could not find this grouop.');
            }
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
                    description: row['description'],
                    approved: row['approved'],
                    admin: row['admin_status'],
                    id: row['group_id']
                });
            });
            return groups;
        });
    }
}

export default Group;