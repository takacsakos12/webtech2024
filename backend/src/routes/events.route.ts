import { Router } from "express";
import { EventModel } from "../models/event.model.js";
import { FightModel } from "../models/fight.model.js";
import { FighterModel } from "../models/fighter.model.js";

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

eventsRouter.get("/:id/fights", async (req, res) => {
  const eventId = Number(req.params.id);

  if (!Number.isSafeInteger(eventId) || eventId < 1) {
    res.status(400).json({
      message: "Érvénytelen eseményazonosító.",
    });
    return;
  }

  const event = await EventModel.findOne({ id: eventId })
    .select("-_id -__v -createdAt -updatedAt")
    .lean();

  if (!event) {
    res.status(404).json({
      message: "Ez az esemény nem található.",
    });
    return;
  }

  const fights = await FightModel.find({ eventId })
    .select("-_id -__v -createdAt -updatedAt")
    .sort({ cardOrder: 1, id: 1 })
    .lean();

  const fighterIds = [
    ...new Set(
      fights.flatMap((fight) => [
        fight.redCornerFighterId,
        fight.blueCornerFighterId,
      ]),
    ),
  ];

  const fighters = await FighterModel.find({
    id: { $in: fighterIds },
  })
    .select("-_id -__v -createdAt -updatedAt")
    .lean();

  const fightersById = new Map(
    fighters.map((fighter) => [fighter.id, fighter]),
  );

  res.json({
    ...event,
    fights: fights.map((fight) => ({
      ...fight,
      redCorner: fightersById.get(fight.redCornerFighterId) ?? null,
      blueCorner: fightersById.get(fight.blueCornerFighterId) ?? null,
    })),
  });
});
