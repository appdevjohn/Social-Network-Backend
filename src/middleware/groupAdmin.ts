import { Request, Response, NextFunction } from 'express';

import Group from '../models/group';
import RequestError from '../util/error';

const isGroupAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const groupId = req.params.groupId;

    const isAdmin = await Group.isUserAdmin(groupId, req.userId!);

    if (!isAdmin) {
        throw RequestError.notGroupAdmin();
    }
}

export default isGroupAdmin;