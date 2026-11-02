import { Router } from 'express';
import { DEMO_EVENTS } from '../data/events.data.js';

export const eventsRouter = Router();

eventsRouter.get('/', (_req, res) => {
  res.json(DEMO_EVENTS);
});

eventsRouter.get('/:id', (req, res) => {
  const id = Number(req.params.id);

  if(!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'Invalid event ID' });
    return;
  }

  const event = DEMO_EVENTS.find(event => event.id === id);

  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  res.json(event);
});