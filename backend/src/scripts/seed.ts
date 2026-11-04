import "dotenv/config";
import mongoose from "mongoose";

import { connectDatabase } from "../config/db.js";

import { ProductModel } from "../models/product.model.js";
import { EventModel } from "../models/event.model.js";
import { OrderModel } from "../models/order.model.js";
import { FighterModel } from "../models/fighter.model.js";
import { FightModel } from "../models/fight.model.js";

import { products } from "../data/products.data.js";
import { DEMO_EVENTS } from "../data/events.data.js";
import { DEMO_FIGHTERS } from "../data/figthers.data.js";
import { DEMO_FIGHTS } from "../data/fights.data.js";

async function seed() {
  try {
    await connectDatabase();

    await Promise.all([
      ProductModel.init(),
      EventModel.init(),
      OrderModel.init(),
      FighterModel.init(),
      FightModel.init(),
    ]);

    let newProducts = 0;
    let newEvents = 0;
    let newFighters = 0;
    let newFights = 0;

    // A meglévő termékeket és készleteket nem módosítjuk.
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

    // Az eseményeknek a meccsek előtt kell bekerülniük.
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

    // A harcosoknak szintén a meccsek előtt kell bekerülniük.
    for (const fighter of DEMO_FIGHTERS) {
      const existing = await FighterModel.findOne({
        id: fighter.id,
      });

      if (existing) {
        existing.set(fighter);
        await existing.save();
      } else {
        await FighterModel.create(fighter);
        newFighters++;
      }
    }

    // Csak létező eseményhez és harcosokhoz készítünk meccset.
    for (const fight of DEMO_FIGHTS) {
      const exists = await FightModel.exists({
        id: fight.id,
      });

      if (exists) {
        await FightModel.updateOne(
          { id: fight.id },
          {
            $set: {
              isTitleFight: fight.isTitleFight,
            },
          },
          { runValidators: true },
        );

        continue;
      }

      const [event, redFighter, blueFighter] = await Promise.all([
        EventModel.exists({
          id: fight.eventId,
        }),
        FighterModel.exists({
          id: fight.redCornerFighterId,
        }),
        FighterModel.exists({
          id: fight.blueCornerFighterId,
        }),
      ]);

      if (!event) {
        throw new Error(
          `A(z) ${fight.id}. meccs eseménye nem létezik: ` + fight.eventId,
        );
      }

      if (!redFighter || !blueFighter) {
        throw new Error(`A(z) ${fight.id}. meccs egyik harcosa nem létezik.`);
      }

      // A create a modell dokumentumellenőrzéseit is lefuttatja.
      await FightModel.create(fight);
      newFights++;
    }

    console.log("Adatfeltöltés kész.");
    console.log(`Új termékek: ${newProducts}`);
    console.log(`Új események: ${newEvents}`);
    console.log(`Új harcosok: ${newFighters}`);
    console.log(`Új meccsek: ${newFights}`);
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((error: unknown) => {
  console.error(
    "Feltöltési hiba:",
    error instanceof Error ? error.message : "Ismeretlen hiba.",
  );

  process.exitCode = 1;
});
