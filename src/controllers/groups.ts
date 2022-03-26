import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

import Group from '../models/group';
import RequestError from '../util/error';
import { getUploadURL } from '../util/upload';

export const validateGroupName = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const groupName = req.params.groupName;

    return Group.findByName(groupName).then(() => {
        return res.status(200).json({
            groupName: groupName,
            valid: true
        });
    }).catch(() => {
        return res.status(200).json({
            groupName: groupName,
            valid: false
        });
    });
}

export const getGroupWithNameLike = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const groupSearch: string = req.params.groupName;

    Group.findByNameLike(groupSearch, 20).then(groups => {
        return res.status(200).json({
            groups: groups
        });

    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not search the database for groups with this name.', 500));
    });
}

export const getGroups = async (req: Request, res: Response, next: NextFunction) => {
    let groups: Group[];

    try {
        groups = await Group.findByUserId(req.userId!);
        groups = groups.filter(g => g.approved);
    } catch (error) {
        return next(RequestError.withMessageAndCode('Could not get groups.', 500));
    }

    return res.status(200).json({
        groups: groups
    });
}

export const getGroup = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const groupId: string | null = req.params.groupId || null;
    const groupName: string | null = req.params.groupName || null;

    try {
        let group: Group;
        if (groupId) {
            group = await Group.findById(groupId);

        } else if (groupName) {
            group = await Group.findByName(groupName);

        } else {
            return next(RequestError.withMessageAndCode('A group id or group name is required to get a group.', 406));
        }

        const response: any = {
            group: group,
        }

        if (req.memberGroupId === groupId) {
            const members = await group.members();
            const requests = await group.requests();

            response.members = members.map(member => {
                return {
                    id: member.id,
                    firstName: member.firstName,
                    lastName: member.lastName,
                    username: member.username,
                    email: member.email,
                    admin: member.admin,
                    profilePicURL: getUploadURL(member.profilePicURL)
                }
            });

            response.requests = requests.map(user => {
                return {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    username: user.username,
                    email: user.email,
                    profilePicURL: getUploadURL(user.profilePicURL)
                }
            });
        }

        return res.status(200).json(response);

    } catch (error) {
        return next(RequestError.withMessageAndCode('Could not get this group.', 500));
    }
}

export const newGroup = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const groupName: string = req.body.name.trim();
    const groupDescription: string = req.body.description.trim();

    const group = new Group({
        name: groupName,
        description: groupDescription
    });

    return group.create().then(() => {
        return group.addUser(req.userId!, true, true);

    }).then(() => {
        return group.members();

    }).then(members => {
        return res.status(201).json({
            group: group,
            members: members.map(member => {
                return {
                    id: member.id,
                    firstName: member.firstName,
                    lastName: member.lastName,
                    username: member.username,
                    email: member.email,
                    admin: member.admin,
                    profilePicURL: getUploadURL(member.profilePicURL)
                }
            })
        });

    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not create group.', 500));
    })
}

export const editGroup = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const groupId: string = req.body.id;
    const groupName: string | null = req.body.name ? req.body.name.trim() : null;
    const groupDescription: string | null = req.body.description ? req.body.description.trim() : null;

    let updatedGroup: Group;
    return Group.findById(groupId).then(group => {
        updatedGroup = group;
        if (groupName && groupName.length > 0) {
            updatedGroup.name = groupName;
        }
        if (groupDescription && groupDescription.length > 0) {
            updatedGroup.description = groupDescription;
        }
        return updatedGroup.update();

    }).then(() => {
        return updatedGroup.members().then(members => {
            return res.status(200).json({
                group: updatedGroup,
                members: members.map(member => {
                    return {
                        id: member.id,
                        firstName: member.firstName,
                        lastName: member.lastName,
                        username: member.username,
                        email: member.email,
                        admin: member.admin,
                        profilePicURL: getUploadURL(member.profilePicURL)
                    }
                })
            });
        }).catch(error => {
            console.error(error);
            return next(RequestError.withMessageAndCode('Could not update group.', 500));
        });
    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not update group.', 500));
    });
}

export const deleteGroup = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const groupId: string = req.params.groupId;

    let deletedGroup: Group;
    return Group.findById(groupId).then(group => {
        deletedGroup = group;
        return deletedGroup.delete();

    }).then(() => {
        return res.status(200).json({
            group: deletedGroup
        });
    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not delete group.', 500));
    });
}

export const addUserToGroup = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const groupId: string = req.params.groupId;
    const userId: string = req.body.userId;

    try {
        const group = await Group.findById(groupId);
        await group.addUser(userId, false, false);

        return res.status(201).json({
            group: {
                ...group,
                admin: false,
                approved: false
            }
        });

    } catch (error) {
        console.error(error);
        return next(RequestError.withMessageAndCode((error as Error).message || 'Something went wrong adding this user to a group.', 400));
    }
}

export const removeUserFromGroup = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const groupId: string = req.params.groupId;
    const userId: string = req.body.userId;

    try {
        const group = await Group.findById(groupId);
        await group.removeUser(userId)

        return res.status(200).json({
            removed: true,
            group: group,
            userId: userId
        });

    } catch (error) {
        console.error(error);
        return next(RequestError.withMessageAndCode('Something went wrong approving this user.', 500));
    }
}

export const approveUserJoinRequest = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const groupId: string = req.params.groupId;
    const userId: string = req.params.userId;

    try {
        const group = await Group.findById(groupId);
        await group.approveUser(userId);

        return res.status(200).json({
            group: group,
            userId: userId
        });

    } catch (error) {
        console.error(error);
        return next(RequestError.withMessageAndCode('Something went wrong approving this user.', 500));
    }
}

export const setAdminStatusOfMember = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const groupId: string = req.params.groupId;
    const userId: string = req.body.userId;
    const adminStatus: boolean = req.body.admin;

    try {
        const group = await Group.findById(groupId);
        await group.setAdmin(userId, adminStatus);

        return res.status(200).json({
            group: group,
            userId: userId,
            admin: adminStatus
        });

    } catch (error) {
        return next(RequestError.withMessageAndCode((error as Error).message, 500));
    }
}

export const getGroupJoinRequests = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const groupId: string = req.params.groupId;

    try {
        const group = await Group.findById(groupId);
        const usersRequesting = await group.requests();

        return res.status(200).json({
            group: group,
            users: usersRequesting.map(user => {
                return {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    username: user.username,
                    email: user.email,
                    profilePicURL: getUploadURL(user.profilePicURL)
                }
            })
        });

    } catch (error) {
        console.error(error);
        return next(RequestError.withMessageAndCode('Something went wrong adding this user to a group.', 500));
    }
}

export const getAdminsInGroup = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const groupId: string = req.params.groupId;

    try {
        const group = await Group.findById(groupId);
        const admins = await group.admins();

        return res.status(200).json({
            group: group,
            admins: admins.map(user => {
                return {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    username: user.username,
                    email: user.email,
                    profilePicURL: getUploadURL(user.profilePicURL)
                }
            })
        });

    } catch (error) {
        console.error(error);
        return next(RequestError.withMessageAndCode('Something went wrong getting admins for this group.', 500));
    }
}

export const getMembersInGroup = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const groupId: string = req.params.groupId;

    try {
        const group = await Group.findById(groupId);
        const members = await group.members();

        return res.status(200).json({
            group: group,
            members: members.map(user => {
                return {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    username: user.username,
                    email: user.email,
                    admin: user.admin,
                    profilePicURL: getUploadURL(user.profilePicURL)
                }
            })
        });

    } catch (error) {
        console.error(error);
        return next(RequestError.withMessageAndCode('Something went wrong getting admins for this group.', 500));
    }
}