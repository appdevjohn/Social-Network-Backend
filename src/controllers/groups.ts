import { Request, Response, NextFunction } from 'express';

import Group from '../models/group';
import RequestError from '../util/error';

export const validateGroupName = (req: Request, res: Response, next: NextFunction) => {
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
    let groups: Group[] = [];

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
    const groupId: string | null = req.params.groupId || null;
    const groupName: string | null = req.params.groupName || null;

    try {
        if (groupId) {
            const group = await Group.findById(groupId);
            return res.status(200).json({
                group: group
            });
        } else if (groupName) {
            const group = await Group.findByName(groupName);
            return res.status(200).json({
                group: group
            });
        } else {
            return next(RequestError.withMessageAndCode('A group id or group name is required to get a group.', 406));
        }
    } catch (error) {
        return next(RequestError.withMessageAndCode('Could not get this group.', 500));
    }
}

export const newGroup = (req: Request, res: Response, next: NextFunction) => {

}

export const editGroup = (req: Request, res: Response, next: NextFunction) => {

}

export const deleteGroup = (req: Request, res: Response, next: NextFunction) => {

}