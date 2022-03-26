import { Request, Response, NextFunction } from 'express';

import Group from '../models/group';
import RequestError from '../util/error';

const isGroupAdmin = async (groupId: string, req: Request, res: Response, next: NextFunction) => {
    const isAdmin = await Group.isUserAdmin(groupId, req.userId!);

    if (!isAdmin) {
        req.adminGroupId = null;
        throw RequestError.notGroupAdmin();
    } else {
        req.adminGroupId = groupId;
        return;
    }
}

export default isGroupAdmin;