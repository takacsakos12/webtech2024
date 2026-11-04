import { app } from "./app.js";
import "dotenv/config";
import { connectDatabase } from "./config/db.js";
import mongoose from "mongoose";
import { OrderModel } from "./models/order.model.js";
import { ProductModel } from "./models/product.model.js";
import { EventModel } from "./models/event.model.js";
import { FighterModel } from './models/fighter.model.js';
import { FightModel } from './models/fight.model.js';

async function startServer() {
  await connectDatabase();

  await Promise.all([
    ProductModel.init(),
    EventModel.init(),
    FighterModel.init(),
    FightModel.init(),
    OrderModel.init(),
  ]);

  const port = Number(process.env.PORT) || 3001;

  app.listen(port, () => {
    console.log(`Backend: http://localhost:${port}`);
  });
}

startServer().catch(async (error) => {
  console.error(
    "A backend nem indult el:",
    error instanceof Error ? error.message : "Ismeretlen hiba.",
  );

  await mongoose.disconnect();
  process.exitCode = 1;
});
