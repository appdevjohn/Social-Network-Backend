import { Request, Response, NextFunction } from 'express';

import Group from '../models/group';
import RequestError from '../util/error';

const isGroupMember = async (groupId: string, req: Request, res: Response, next: NextFunction) => {
    const isMember = await Group.isUserMember(groupId, req.userId!);

    if (!isMember) {
        req.memberGroupId = null;
        throw RequestError.notGroupMember();
    } else {
        req.memberGroupId = groupId;
        return;
    }
}

export default isGroupMember;