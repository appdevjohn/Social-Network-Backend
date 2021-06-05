import {
    AccountType,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    getUserByEmail,
    getUserByUsername
} from '../database/auth';
import query from '../database/index';

export interface UserConfigType {
    firstName: string,
    lastName: string,
    username: string,
    email: string,
    hashedPassword: string,
    activated: boolean,
    activateToken: string,
    id?: string
}

export interface AuthToken {
    userId: string,
    activated: boolean
}

class User {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    hashedPassword: string;
    activated: boolean;
    activateToken?: string | null;
    id?: string;

    constructor(config: UserConfigType) {
        this.firstName = config.firstName || '';
        this.lastName = config.lastName || '';
        this.username = config.username || '';
        this.email = config.email || '';
        this.hashedPassword = config.hashedPassword || '';
        this.activated = config.activated;
        this.activateToken = config.activateToken;
        this.id = config.id;
    }

    /**
     * Creates the user in the database.
     * @returns Whether or not the action was successful.
     */
    create(): Promise<boolean> {
        const newAccount: AccountType = {
            firstName: this.firstName,
            lastName: this.lastName,
            username: this.username,
            email: this.email,
            hashedPassword: this.hashedPassword,
            activated: this.activated,
            activateToken: this.activateToken
        }

        return createUser(newAccount).then(result => {
            if (result.rowCount > 0) {
                this.id = result.rows[0]['user_id'];
                return true;
            } else {
                return false;
            }
        }).catch(error => {
            console.error(error);
            return false;
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
    async activate(token: string): Promise<boolean> {
        if (this.id && token === this.activateToken) {
            this.activated = true;
            this.activateToken = null;
            const success = await this.update();
            return success;
        } else {
            return false;
        }
    }

    /**
     * Updates the user in the database.
     * @returns Whether or not the action was successful.
     */
    update(): Promise<boolean> {
        if (this.id) {
            const updatedAccount: AccountType = {
                firstName: this.firstName,
                lastName: this.lastName,
                username: this.username,
                email: this.email,
                hashedPassword: this.hashedPassword,
                activated: this.activated,
                activateToken: this.activateToken
            }

            return updateUser(this.id, updatedAccount).then(result => {
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

    /**
     * Deletes the user from the database.
     * @returns Whether or not the action was successful.
     */
    delete(): Promise<boolean> {
        if (this.id) {
            return deleteUser(this.id).then(result => {
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

    static parseRow = (row: any): User => {
        return new User({
            firstName: row['first_name'],
            lastName: row['last_name'],
            username: row['username'],
            email: row['email'],
            hashedPassword: row['hashed_password'],
            activated: row['activated'],
            activateToken: row['activate_token'],
            id: row['user_id']
        });
    }
}

export default User;