import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

import Group from '../models/group';
import RequestError from '../util/error';

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

export const getGroups = async (req: Request, res: Response, next: NextFunction) => {
    let groups: Group[];

    try {
        groups = await Group.findByUserId(req.userId!);
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

        const members = await group.members();

        return res.status(200).json({
            group: group,
            members: members.map(member => {
                return {
                    id: member.id,
                    firstName: member.firstName,
                    lastName: member.lastName,
                    username: member.username,
                    email: member.email,
                    profilePicURL: member.profilePicURL
                }
            })
        });

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

    const group = new Group({
        name: groupName
    });

    return group.create().then(() => {
        return group.addUser(req.userId!);

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
                    profilePicURL: member.profilePicURL
                }
            })
        });

    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not create group', 500));
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
    const groupName: string = req.body.name.trim();

    let updatedGroup: Group;
    return Group.findById(groupId).then(group => {
        updatedGroup = group;
        updatedGroup.name = groupName;
        return updatedGroup.update();

    }).then(success => {
        if (success) {
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
                            profilePicURL: member.profilePicURL
                        }
                    })
                });
            }).catch(error => {
                console.error(error);
                return next(RequestError.withMessageAndCode('Could not update group.', 500));
            });
        } else {
            return next(RequestError.withMessageAndCode('Could not update group.', 500));
        }
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

    const groupId: string = req.body.id;

    let deletedGroup: Group;
    return Group.findById(groupId).then(group => {
        deletedGroup = group;
        return deletedGroup.delete();

    }).then(success => {
        if (success) {
            return res.status(200).json({
                group: deletedGroup
            });
        } else {
            return next(RequestError.withMessageAndCode('Could not delete group.', 500));
        }
    }).catch(error => {
        console.error(error);
        return next(RequestError.withMessageAndCode('Could not delete group.', 500));
    });
}