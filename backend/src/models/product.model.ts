import { Schema, model } from "mongoose";
import type { Product } from "../data/products.data.js";

const integerValidator = {
  validator: Number.isSafeInteger,
  message: "Egész számot adj meg.",
};

const productSchema = new Schema<Product>(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      validate: integerValidator,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
      validate: integerValidator,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      validate: integerValidator,
    },

    image: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  {
    collection: "products",
    timestamps: true,
    id: false,
  },
);

export const ProductModel = model<Product>("Product", productSchema);
