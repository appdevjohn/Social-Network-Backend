import { Request, Response, NextFunction } from 'express';

import Group from '../models/group';
import RequestError from '../util/error';

const isGroupAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const groupId = req.params.groupId;

    const isMember = await Group.isUserMember(groupId, req.userId!);

    if (!isMember) {
        throw RequestError.notGroupMember();
    }
}

export default isGroupAdmin;