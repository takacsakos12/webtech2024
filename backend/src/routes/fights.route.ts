import { Router } from "express";
import { FightModel } from "../models/fight.model.js";
import { FighterModel } from "../models/fighter.model.js";
import { EventModel } from "../models/event.model.js";

export const fightsRouter = Router();

type FightFilter = {
  id?: number;
  $or?: Array<{ redCornerFighterId: number } | { blueCornerFighterId: number }>;
};

async function getFightsWithDetails(filter: FightFilter) {
  const projection = "-_id -__v -createdAt -updatedAt";

  const fights = await FightModel.find(filter)
    .select(projection)
    .sort({ eventId: -1, cardOrder: 1, id: 1 })
    .lean();

  const fighterIds = [
    ...new Set(
      fights.flatMap((fight) => [
        fight.redCornerFighterId,
        fight.blueCornerFighterId,
      ]),
    ),
  ];

  const eventIds = [...new Set(fights.map((fight) => fight.eventId))];

  const [fighters, events] = await Promise.all([
    FighterModel.find({ id: { $in: fighterIds } })
      .select(projection)
      .lean(),

    EventModel.find({ id: { $in: eventIds } })
      .select(projection)
      .lean(),
  ]);

  const fightersById = new Map(
    fighters.map((fighter) => [fighter.id, fighter]),
  );

  const eventsById = new Map(events.map((event) => [event.id, event]));

  return fights.map((fight) => ({
    ...fight,
    redCorner: fightersById.get(fight.redCornerFighterId) ?? null,
    blueCorner: fightersById.get(fight.blueCornerFighterId) ?? null,
    event: eventsById.get(fight.eventId) ?? null,
  }));
}

// Egy adott harcos meccsei.
fightsRouter.get("/", async (req, res) => {
  const value = req.query.fighterId;
  const fighterId = typeof value === "string" ? Number(value) : NaN;

  if (!Number.isSafeInteger(fighterId) || fighterId < 1) {
    res.status(400).json({
      message: "Érvényes fighterId paraméter szükséges.",
    });
    return;
  }

  const fighterExists = await FighterModel.exists({
    id: fighterId,
  });

  if (!fighterExists) {
    res.status(404).json({
      message: "Ez a harcos nem található.",
    });
    return;
  }

  const fights = await getFightsWithDetails({
    $or: [
      { redCornerFighterId: fighterId },
      { blueCornerFighterId: fighterId },
    ],
  });

  res.json(fights);
});

fightsRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({
      message: "Érvénytelen meccsazonosító.",
    });
    return;
  }

  const [fight] = await getFightsWithDetails({ id });

  if (!fight) {
    res.status(404).json({
      message: "Ez a meccs nem található.",
    });
    return;
  }

  res.json(fight);
});
