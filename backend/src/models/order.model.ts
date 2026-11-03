import { Schema, model } from "mongoose";

const orderItemSchema = new Schema(
  {
    productId: {
      type: Number,
      required: true,
    },

    sku: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 99,
      validate: Number.isSafeInteger,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },

    requestId: {
      type: String,
      required: true,
      unique: true,
    },

    fingerprint: {
      type: String,
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: "Üres rendelés nem menthető.",
      },
    },

    total: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },

    status: {
      type: String,
      enum: ["recorded"],
      default: "recorded",
      required: true,
    },
  },
  {
    collection: "orders",
    timestamps: true,
    id: false,
  },
);

export const OrderModel = model("Order", orderSchema);
