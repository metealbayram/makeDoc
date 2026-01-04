import { Router } from 'express';
import authorize from '../middlewares/auth.middleware.js';
import { createEvent, getEvents, deleteEvent } from '../controller/events.controller.js';

const eventsRouter = Router();

eventsRouter.post('/', authorize, createEvent);
eventsRouter.get('/', authorize, getEvents);
eventsRouter.delete('/:id', authorize, deleteEvent);

export default eventsRouter;
