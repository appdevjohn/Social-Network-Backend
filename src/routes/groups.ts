import { Router } from 'express';
import * as groupsController from '../controllers/groups';
import isAuth from '../middleware/auth';

const router = Router();

router.get('/validate/:groupName', isAuth, groupsController.validateGroupName);

router.get('/', isAuth, groupsController.getGroups);

router.get('/:groupId', isAuth, groupsController.getGroup);

router.post('/new', isAuth, groupsController.newGroup);

router.put('/edit', isAuth, groupsController.editGroup);

router.delete('/delete', isAuth, groupsController.deleteGroup);

export default router;