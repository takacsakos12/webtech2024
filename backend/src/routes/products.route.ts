import { Router } from "express";

import { getProducts, createPurchase } from "../services/purchase.service.js";

export const productsRouter = Router();

productsRouter.get("/", async (_req, res) => {
  res.json(await getProducts());
});

productsRouter.post("/demo-purchase", async (req, res) => {
  const result = await createPurchase(req.body);

  res.status(200).json(result);
});
