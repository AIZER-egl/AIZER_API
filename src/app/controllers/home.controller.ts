import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.json({ message: 'All systems working' });
});

router.post('/', (req, res) => {
    res.json({ req: req.body });
});

export default router;
