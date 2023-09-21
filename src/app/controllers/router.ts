import { Router } from 'express';

import AuthController from './auth.controller';
import HomeController from './home.controller';
import UserController from './users.controller';

const router = Router();

router.use('/', HomeController);
router.use('/auth', AuthController);
router.use('/users', UserController);

export default router;