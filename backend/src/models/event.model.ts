import { Schema, model } from 'mongoose';
import type { MmaEvent } from '../data/events.data.js';

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

const eventSchema = new Schema<MmaEvent>(
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
      maxlength: 150,
    },

    date: {
      type: String,
      required: true,
      validate: {
        validator: isValidDate,
        message: 'Érvénytelen dátum. ÉÉÉÉ-HH-NN formátumot használj.',
      },
    },

    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    organization: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
  },
  {
    collection: 'events',
    timestamps: true,
    id: false,
  }
);

export const EventModel = model<MmaEvent>(
  'MmaEvent',
  eventSchema
);