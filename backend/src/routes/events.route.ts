import { Router } from 'express';
import { DEMO_EVENTS } from '../data/events.data.js';

export const eventsRouter = Router();

eventsRouter.get('/', (_req, res) => {
  res.json(DEMO_EVENTS);
});