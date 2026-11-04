import express from "express";
import type { Request, Response, NextFunction } from "express";

import { eventsRouter } from "./routes/events.route.js";
import { productsRouter } from "./routes/products.route.js";
import { PurchaseError } from "./services/purchase.service.js";
import { fightersRouter } from "./routes/fighters.route.js";
import { fightsRouter } from "./routes/fights.route.js";
export const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ message: "ok" });
});

app.use("/api/events", eventsRouter);
app.use("/api/products", productsRouter);
app.use("/api/fighters", fightersRouter);
app.use("/api/fights", fightsRouter);

app.use((_req, res) => {
  res.status(404).json({
    message: "Végpont nem található.",
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof PurchaseError) {
    res.status(error.status).json({
      message: error.message,
    });
    return;
  }

  if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400
  ) {
    res.status(400).json({
      message: "Érvénytelen JSON.",
    });
    return;
  }

  console.error(
    "Szerverhiba:",
    error instanceof Error ? error.message : "Ismeretlen hiba.",
  );

  res.status(500).json({
    message: "Átmeneti szerverhiba. Próbáld újra.",
  });
});
