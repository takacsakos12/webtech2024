import { Router } from "express";
import { FighterModel } from "../models/fighter.model.js";

export const fightersRouter = Router();

fightersRouter.get("/", async (_req, res) => {
  const fighters = await FighterModel.find()
    .select("-_id -__v -createdAt -updatedAt")
    .sort({ id: 1 })
    .lean();

    res.json(fighters);
});

fightersRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({
      message: "Érvénytelen harcosazonosító.",
    });
    return;
  }

  const fighter = await FighterModel.findOne({ id })
    .select("-_id -__v -createdAt -updatedAt")
    .lean();

    if (!fighter) {
    res.status(404).json({
      message: "Ez a harcos nem található.",
    });
    return;
  }

  res.json(fighter);
});

