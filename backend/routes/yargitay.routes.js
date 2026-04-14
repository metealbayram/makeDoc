import { Router } from 'express';
import authorize from '../middlewares/auth.middleware.js';
import { searchYargitay, getYargitayDetail } from '../controller/yargitay.controller.js';

const yargitayRouter = Router();

yargitayRouter.get('/search', authorize, searchYargitay);
yargitayRouter.get('/:id', authorize, getYargitayDetail);

export default yargitayRouter;
