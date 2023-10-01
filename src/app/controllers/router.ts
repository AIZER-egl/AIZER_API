import { Router } from 'express';

import AuthController from './auth.controller';
import HomeController from './home.controller';
import UserController from './users.controller';
import GroupsController from './groups.controller';

const router = Router();

router.use('/', HomeController);
router.use('/auth', AuthController);
router.use('/users', UserController);
router.use('/groups', GroupsController);
export default router;