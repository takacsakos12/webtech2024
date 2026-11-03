import { Router } from "express";
import { EventModel } from "../models/event.model.js";

export const eventsRouter = Router();

eventsRouter.get("/", async (_req, res) => {
  const events = await EventModel.find()
    .select("-_id -__v -createdAt -updatedAt")
    .sort({ date: 1, id: 1 })
    .lean();

  res.json(events);
});

eventsRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({
      message: "Érvénytelen eseményazonosító.",
    });
    return;
  }

  const event = await EventModel.findOne({ id })
    .select("-_id -__v -createdAt -updatedAt")
    .lean();

  if (!event) {
    res.status(404).json({
      message: "Ez az esemény nem található.",
    });
    return;
  }

  res.json(event);
});
