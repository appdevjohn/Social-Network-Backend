import { AccountType, getUser, createUser, updateUser, deleteUser, getUserByEmail } from '../database/auth';
import query from '../database/index';

export interface UserConfigType {
    firstName: string,
    lastName: string,
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
    email: string;
    hashedPassword: string;
    activated: boolean;
    activateToken?: string | null;
    id?: string;

    constructor(config: UserConfigType) {
        this.firstName = config.firstName || '';
        this.lastName = config.lastName || '';
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
    create = (): Promise<boolean> => {
        const newAccount: AccountType = {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            hashedPassword: this.hashedPassword,
            activated: this.activated,
            activateToken: this.activateToken
        }

        return createUser(newAccount).then(result => {
            if (result.rowCount > 0) {
                this.id = result.rows[0].id;
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
    isCreated = (): Promise<boolean> => {
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
    activate = async (token: string): Promise<boolean> => {
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
    update = (): Promise<boolean> => {
        if (this.id) {
            const updatedAccount: AccountType = {
                firstName: this.firstName,
                lastName: this.lastName,
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
    delete = (): Promise<boolean> => {
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

    static findById = (userId: string): Promise<User> => {
        return getUser(userId).then(result => {
            if (result.rowCount > 0) {
                return new User({
                    firstName: result.rows[0]['first_name'],
                    lastName: result.rows[0]['last_name'],
                    email: result.rows[0]['email'],
                    hashedPassword: result.rows[0]['hashed_password'],
                    activated: result.rows[0]['activated'],
                    activateToken: result.rows[0]['activate_token'],
                    id: result.rows[0]['id']
                });
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
                return new User({
                    firstName: result.rows[0]['first_name'],
                    lastName: result.rows[0]['last_name'],
                    email: result.rows[0]['email'],
                    hashedPassword: result.rows[0]['hashed_password'],
                    activated: result.rows[0]['activated'],
                    activateToken: result.rows[0]['activate_token'],
                    id: result.rows[0]['id']
                });
            } else {
                throw new Error('Could not find this account.');
            }
        }).catch(error => {
            throw new Error(error);
        });
    }

    static accountWithEmailExists = async (email: string): Promise<boolean> => {
        const result = await query('SELECT id FROM users WHERE email = $1;', [email]);
        return result.rowCount > 0;
    }
}

export default User;