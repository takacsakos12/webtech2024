import { Schema, model } from "mongoose";

const positiveId = {
  type: Number,
  required: true,
  min: 1,
  validate: Number.isSafeInteger,
};

const resultSchema = new Schema(
  {
    outcome: {
      type: String,
      required: true,
      enum: ["win", "draw", "no-contest"],
    },

    winnerId: {
      type: Number,
      min: 1,
      validate: Number.isSafeInteger,
    },

    method: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    round: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger,
    },

    time: {
      type: String,
      required: true,
      match: /^\d{1,2}:[0-5]\d$/,
    },
  },
  {
    _id: false,
  },
);

const fightSchema = new Schema(
  {
    id: {
      ...positiveId,
      unique: true,
    },

    eventId: { ...positiveId },

    redCornerFighterId: { ...positiveId },

    blueCornerFighterId: { ...positiveId },

    weightClass: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    scheduledRounds: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 5],
      default: 3,
    },

    cardOrder: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger,
    },

    isMainEvent: {
      type: Boolean,
      required: true,
      default: false,
    },

    status: {
      type: String,
      required: true,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },

    result: {
      type: resultSchema,
      default: undefined,
    },
  },
  {
    collection: "fights",
    timestamps: true,
    id: false,
  },
);

// Egy esemény meccseit megjelenítési sorrendben kérjük le.
fightSchema.index({ eventId: 1, cardOrder: 1 });

// Harcosprofilnál mindkét sarokban kereshetünk.
fightSchema.index({ redCornerFighterId: 1 });
fightSchema.index({ blueCornerFighterId: 1 });

fightSchema.pre("validate", function () {
  if (this.redCornerFighterId === this.blueCornerFighterId) {
    this.invalidate(
      "blueCornerFighterId",
      "Egy harcos nem mérkőzhet saját magával.",
    );
  }

  if (this.status === "completed" && !this.result) {
    this.invalidate("result", "A befejezett meccshez eredmény szükséges.");
  }

  if (this.status !== "completed" && this.result) {
    this.invalidate("result", "Csak befejezett meccshez adható eredmény.");
  }

  if (!this.result) {
    return;
  }

  const { outcome, winnerId, round } = this.result;

  if (
    outcome === "win" &&
    winnerId !== this.redCornerFighterId &&
    winnerId !== this.blueCornerFighterId
  ) {
    this.invalidate(
      "result.winnerId",
      "A győztesnek a két résztvevő egyikének kell lennie.",
    );
  }

  if (outcome !== "win" && winnerId !== undefined) {
    this.invalidate(
      "result.winnerId",
      "Döntetlenhez vagy no-contest eredményhez nem adható győztes.",
    );
  }

  if (round > this.scheduledRounds) {
    this.invalidate(
      "result.round",
      "Az eredmény menete nem lehet több a tervezett meneteknél.",
    );
  }
});

export const FightModel = model("Fight", fightSchema);
