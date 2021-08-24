import {
    AccountType,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    getUserByEmail,
    getUserByUsername,
    getUserBySocketId
} from '../database/user';
import query from '../database/index';
import Conversation from './conversation';
import Group from './group';

export interface UserConfigType {
    createdAt?: Date;
    updatedAt?: Date;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    profilePicURL?: string | null;
    hashedPassword: string;
    activated: boolean;
    activateToken?: string | null;
    activateTokenTimestamp?: Date | null;
    resetPasswordToken?: string | null;
    resetPasswordTokenTimestamp?: Date | null;
    socketId?: string | null;
    id?: string;
}

export interface AuthToken {
    userId: string,
    activated: boolean
}

class User {
    createdAt?: Date;
    updatedAt?: Date;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    profilePicURL?: string | null;
    hashedPassword: string;
    activated: boolean;
    activateToken?: string | null;
    activateTokenTimestamp: Date;
    resetPasswordToken?: string | null;
    resetPasswordTokenTimestamp: Date;
    socketId?: string | null;
    id?: string;

    constructor(config: UserConfigType) {
        this.createdAt = config.createdAt;
        this.updatedAt = config.updatedAt;
        this.firstName = config.firstName || '';
        this.lastName = config.lastName || '';
        this.username = config.username || '';
        this.email = config.email || '';
        this.profilePicURL = config.profilePicURL;
        this.hashedPassword = config.hashedPassword || '';
        this.activated = config.activated;
        this.activateToken = config.activateToken;
        this.activateTokenTimestamp = config.activateTokenTimestamp || new Date();
        this.resetPasswordToken = config.resetPasswordToken;
        this.resetPasswordTokenTimestamp = config.resetPasswordTokenTimestamp || new Date();
        this.socketId = config.socketId;
        this.id = config.id;
    }

    /**
     * Creates the user in the database.
     * @returns Whether or not the action was successful.
     */
    create(): Promise<User> {
        const newAccount: AccountType = {
            firstName: this.firstName,
            lastName: this.lastName,
            username: this.username,
            email: this.email,
            profilePicURL: this.profilePicURL,
            hashedPassword: this.hashedPassword,
            activated: this.activated,
            activateToken: this.activateToken,
            resetPasswordToken: this.resetPasswordToken,
            socketId: this.socketId
        }

        return createUser(newAccount).then(result => {
            if (result.rowCount > 0) {
                this.createdAt = result.rows[0]['created_at'];
                this.updatedAt = result.rows[0]['updated_at'];
                this.activateTokenTimestamp = result.rows[0]['activate_token_timestamp'];
                this.resetPasswordTokenTimestamp = result.rows[0]['reset_password_token_timestamp'];
                this.id = result.rows[0]['user_id'];
                return this;
            } else {
                throw new Error('Could not update user on database.');
            }
        }).catch(error => {
            console.error(error);
            throw new Error(error);
        })
    }

    /**
     * Finds out if this user exists in the database.
     * @returns Whether or not the user has been created in the database.
     */
    isCreated(): Promise<boolean> {
        if (this.id) {
            return getUser(this.id).then(result => {
                return result.rowCount > 0;
            }).catch(() => {
                return false;
            });
        } else {
            return Promise.resolve(false);
        }
    }

    /**
     * Activates the account with the activation token.
     * @param token The token used to activate the account.
     * @returns Whether or not the token could successfully activate the account.
     */
    async activate(token: string): Promise<User> {
        if (this.id) {
            if (token !== this.activateToken) {
                throw new Error('The activation token is incorrect.');
            } else if (this.activateTokenTimestamp < new Date(Date.now() - 15 * 60 * 1000)) {
                throw new Error('The activation token is expired. You need to request a new one.');
            }

            this.activated = true;
            this.activateToken = null;
            await this.update();
            return this;

        } else {
            throw new Error('User is not yet saved to the database.');
        }
    }

    /**
     * Updates the user in the database.
     * @returns Whether or not the action was successful.
     */
    update(): Promise<User> {
        if (this.id) {
            const updatedAccount: AccountType = {
                firstName: this.firstName,
                lastName: this.lastName,
                username: this.username,
                email: this.email,
                profilePicURL: this.profilePicURL,
                hashedPassword: this.hashedPassword,
                activated: this.activated,
                activateToken: this.activateToken,
                socketId: this.socketId
            }

            return updateUser(this.id, updatedAccount).then(result => {
                if (result.rowCount > 0) {
                    this.updatedAt = result.rows[0]['updated_at'];
                    this.activateTokenTimestamp = result.rows[0]['activate_token_timestamp'];
                    this.resetPasswordTokenTimestamp = result.rows[0]['reset_password_token_timestamp'];
                    return this;
                } else {
                    throw new Error('Could not update user with database.');
                }
            }).catch(error => {
                console.error(error);
                throw new Error(error);
            });
        } else {
            throw new Error('This user does not exist.')
        }
    }

    /**
     * Deletes the user from the database.
     * @returns Whether or not the action was successful.
     */
    delete(): Promise<User> {
        if (this.id) {
            return Conversation.findByUserId(this.id!).then(conversations => {
                const leaveConvoPromises = conversations.map(convo => {
                    return convo.removeUser(this.id!);
                });
                return Promise.all(leaveConvoPromises);

            }).then(() => {
                return Group.findByUserId(this.id!);

            }).then(groups => {
                const leaveGroupPromises = groups.map(group => {
                    return group.removeUser(this.id!);
                });
                return Promise.all(leaveGroupPromises);

            }).then(() => {
                return deleteUser(this.id!);

            }).then(result => {
                if (result.rowCount > 0) {
                    return this;
                } else {
                    throw new Error('Could not delete user from database.');
                }
            }).catch(error => {
                console.error(error);
                throw new Error('Could not delete user from database.');
            });
        } else {
            throw new Error('Could not delete user.')
        }
    }

    static accountWithEmailExists = async (email: string): Promise<boolean> => {
        const result = await query('SELECT user_id FROM users WHERE email = $1;', [email]);
        return result.rowCount > 0;
    }

    static findById = (userId: string): Promise<User> => {
        return getUser(userId).then(result => {
            if (result.rowCount > 0) {
                return User.parseRow(result.rows[0]);
            } else {
                throw new Error('Could not find this account.');
            }
        }).catch(error => {
            throw new Error(error);
        });
    }

    static findByEmail = (email: string): Promise<User> => {
        return getUserByEmail(email).then(result => {
            if (result.rowCount > 0) {
                return User.parseRow(result.rows[0]);
            } else {
                throw new Error('Could not find this account.');
            }
        }).catch(error => {
            throw new Error(error);
        });
    }

    static findByUsername = (username: string): Promise<User> => {
        return getUserByUsername(username).then(result => {
            if (result.rowCount > 0) {
                return User.parseRow(result.rows[0]);
            } else {
                throw new Error('Could not find this account.');
            }
        }).catch(error => {
            throw new Error(error);
        });
    }

    static findBySocketId = (socketId: string): Promise<User | null> => {
        return getUserBySocketId(socketId).then(result => {
            if (result.rowCount > 0) {
                return User.parseRow(result.rows[0]);
            } else {
                throw new Error('Could not find this account.');
            }
        }).catch(() => {
            // User not online
            return null;
        });
    }

    static parseRow = (row: any): User => {
        return new User({
            createdAt: row['created_at'],
            updatedAt: row['updated_at'],
            firstName: row['first_name'],
            lastName: row['last_name'],
            username: row['username'],
            email: row['email'],
            profilePicURL: row['profile_pic_url'],
            hashedPassword: row['hashed_password'],
            activated: row['activated'],
            activateToken: row['activate_token'],
            activateTokenTimestamp: row['activate_token_timestamp'],
            resetPasswordToken: row['reset_password_token'],
            resetPasswordTokenTimestamp: row['reset_password_token_timestamp'],
            socketId: row['socket_id'],
            id: row['user_id']
        });
    }
}

export default User;