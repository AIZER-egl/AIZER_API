import { Router } from 'express';

import AuthController from './auth.controller';
import HomeController from './home.controller';

const router = Router();

router.use('/', HomeController);
router.use('/auth', AuthController);

export default router;