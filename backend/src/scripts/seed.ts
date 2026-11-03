import "dotenv/config";
import mongoose from "mongoose";

import { connectDatabase } from "../config/db.js";



import { products } from "../data/products.data.js";
import { DEMO_EVENTS } from "../data/events.data.js";
import { ProductModel } from '../models/product.model.js';
import { EventModel } from '../models/event.model.js';
import { OrderModel } from '../models/order.model.js';

async function seed() {
  try {
    await connectDatabase();

    await Promise.all([
      ProductModel.init(),
      EventModel.init(),
      OrderModel.init(),
    ]);

    let newProducts = 0;
    let newEvents = 0;

    for (const product of products) {
      const now = new Date();

      const result = await ProductModel.updateOne(
        { id: product.id },
        {
          $setOnInsert: {
            ...product,
            createdAt: now,
            updatedAt: now,
          },
        },
        {
          upsert: true,
          runValidators: true,
          timestamps: false,
        },
      );

      newProducts += result.upsertedCount;
    }

    for (const event of DEMO_EVENTS) {
      const now = new Date();

      const result = await EventModel.updateOne(
        { id: event.id },
        {
          $setOnInsert: {
            ...event,
            createdAt: now,
            updatedAt: now,
          },
        },
        {
          upsert: true,
          runValidators: true,
          timestamps: false,
        },
      );

      newEvents += result.upsertedCount;
    }

    console.log(`Új termékek: ${newProducts}; új események: ${newEvents}`);
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((error) => {
  console.error(
    "Feltöltési hiba:",
    error instanceof Error ? error.message : "Ismeretlen hiba.",
  );

  process.exitCode = 1;
});
