import express from "express";
import { eventsRouter } from "./routes/events.route.js";

export const app = express();

app.use(express.json());

app.get("api/health", (req, res) => {
  res.status(200).json({ message: "ok" });
});

app.use("/api/events", eventsRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Végpont nem található" });
});
