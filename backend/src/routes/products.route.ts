import { Router } from "express";
import { randomUUID } from "node:crypto";
import { products } from "../data/products.data.js";

export const productsRouter = Router();

const completed = new Map<
  string,
  {
    fingerprint: string;
    id: string;
    total: number;
  }
>();

productsRouter.get("/", (_req, res) => {
  res.json(products);
});

productsRouter.post("/demo-purchase", (req, res) => {
  const body: unknown = req.body;

  if (
    !body ||
    typeof body !== "object" ||
    !("requestId" in body) ||
    !("items" in body)
  ) {
    res.status(400).json({ message: "Érvénytelen kérés." });
    return;
  }

  const { requestId, items } = body;

  if (
    typeof requestId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(requestId) ||
    !Array.isArray(items) ||
    items.length < 1 ||
    items.length > 100
  ) {
    res.status(400).json({
      message: "Érvénytelen kérésazonosító vagy kosár.",
    });
    return;
  }

  const quantities = new Map<number, number>();

  for (const entry of items) {
    const item: unknown = entry;

    if (
      !item ||
      typeof item !== "object" ||
      !("productId" in item) ||
      !("quantity" in item)
    ) {
      res.status(400).json({ message: "Érvénytelen kosártétel." });
      return;
    }

    const { productId, quantity } = item;

    if (
      typeof productId !== "number" ||
      !Number.isSafeInteger(productId) ||
      productId < 1 ||
      typeof quantity !== "number" ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    ) {
      res.status(400).json({
        message: "Érvénytelen termék vagy mennyiség.",
      });
      return;
    }

    // Az ismételten megadott termékeket összevonjuk.
    const combined = (quantities.get(productId) || 0) + quantity;

    if (combined > 99) {
      res.status(400).json({
        message: "Termékenként legfeljebb 99 darab vásárolható.",
      });
      return;
    }

    quantities.set(productId, combined);
  }

  const lines = [...quantities].sort(([a], [b]) => a - b);
  const fingerprint = JSON.stringify(lines);
  const previous = completed.get(requestId);

  if (previous) {
    if (previous.fingerprint !== fingerprint) {
      res.status(409).json({
        message: "Ez a kérésazonosító már másik vásárláshoz tartozik.",
      });
      return;
    }

    res.json({
      id: previous.id,
      total: previous.total,
      products,
    });
    return;
  }

  // Először minden tételt ellenőrzünk, módosítás nélkül.
  for (const [id, quantity] of lines) {
    const product = products.find((product) => product.id === id);

    if (!product) {
      res.status(400).json({ message: "Ismeretlen termék." });
      return;
    }

    if (product.stock < quantity) {
      res.status(409).json({
        message: `${product.name}: csak ${product.stock} db van raktáron.`,
      });
      return;
    }
  }

  let total = 0;

  for (const [id, quantity] of lines) {
    const product = products.find((product) => product.id === id)!;

    total += product.price * quantity;
    product.stock -= quantity;
  }

  const id = randomUUID();

  completed.set(requestId, {
    fingerprint,
    id,
    total,
  });

  res.status(201).json({ id, total, products });
});
