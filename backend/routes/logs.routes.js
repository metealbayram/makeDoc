import { Router } from 'express';
import authorize from '../middlewares/auth.middleware.js';

const logRouter = Router();


logRouter.get('/', authorize, (req, res) => {
    res.json({ message: 'Get all logs' });
});


logRouter.get('/user/:id', authorize, (req, res) => {
    res.json({ message: `Get logs for user ${req.params.id}` });
});

export default logRouter;