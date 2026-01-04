import { Router } from 'express';
import authorize from '../middlewares/auth.middleware.js';


const templateRouter = Router();


templateRouter.get('/', authorize, (req, res) => {
    res.json({ message: 'Get all templates' });
});


templateRouter.get('/:id', authorize, (req, res) => {
    res.json({ message: `Get template with ID ${req.params.id}` });
});


templateRouter.post('/', authorize, (req, res) => {
    res.json({ message: 'Template created successfully', data: req.body });
});


templateRouter.put('/:id', authorize, (req, res) => {
    res.json({ message: `Template with ID ${req.params.id} updated` });
});


templateRouter.delete('/:id', authorize, (req, res) => {
    res.json({ message: `Template with ID ${req.params.id} deleted` });
});

export default templateRouter;