import { Schema, model } from "mongoose";

const nonNegativeInteger = {
  type: Number,
  required: true,
  default: 0,
  min: 0,
  validate: {
    validator: Number.isSafeInteger,
    message: "Nemnegatív egész számot adj meg.",
  },
};

const fighterSchema = new Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      validate: Number.isSafeInteger,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    nickname: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    birthDate: {
      type: String,
      required: true,
      validate: {
        validator(value: string) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
          }

          const date = new Date(`${value}T00:00:00.000Z`);

          return (
            !Number.isNaN(date.getTime()) &&
            date.toISOString().slice(0, 10) === value &&
            date.getTime() <= Date.now()
          );
        },
        message: "Érvényes, nem jövőbeli születési dátumot adj meg.",
      },
    },

    weightClass: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    organization: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    image: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    wins: { ...nonNegativeInteger },
    losses: { ...nonNegativeInteger },
    draws: { ...nonNegativeInteger },
    noContests: { ...nonNegativeInteger },
  },
  {
    collection: "fighters",
    timestamps: true,
    id: false,
  },
);

export const FighterModel = model("Fighter", fighterSchema);
