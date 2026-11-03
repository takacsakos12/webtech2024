import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';

import { ProductModel } from '../models/product.model.js';
import { OrderModel } from '../models/order.model.js';

export class PurchaseError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export function getProducts() {
  return ProductModel.find()
    .select('-_id -__v -createdAt -updatedAt')
    .sort({ id: 1 })
    .lean();
}

function parseCart(body: unknown) {
  if (
    !body ||
    typeof body !== 'object' ||
    !('requestId' in body) ||
    !('items' in body)
  ) {
    throw new PurchaseError(400, 'Érvénytelen kérés.');
  }

  const { requestId, items } = body;

  const validRequestId =
    typeof requestId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      .test(requestId);

  if (
    !validRequestId ||
    !Array.isArray(items) ||
    items.length < 1 ||
    items.length > 100
  ) {
    throw new PurchaseError(
      400,
      'Érvénytelen kérésazonosító vagy kosár.'
    );
  }

  const quantities = new Map<number, number>();

  for (const entry of items) {
    const item: unknown = entry;

    if (
      !item ||
      typeof item !== 'object' ||
      !('productId' in item) ||
      !('quantity' in item)
    ) {
      throw new PurchaseError(400, 'Érvénytelen kosártétel.');
    }

    const { productId, quantity } = item;

    if (
      typeof productId !== 'number' ||
      !Number.isSafeInteger(productId) ||
      productId < 1 ||
      typeof quantity !== 'number' ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    ) {
      throw new PurchaseError(
        400,
        'Érvénytelen termék vagy mennyiség.'
      );
    }

    const combined =
      (quantities.get(productId) || 0) + quantity;

    if (combined > 99) {
      throw new PurchaseError(
        400,
        'Termékenként legfeljebb 99 darab vásárolható.'
      );
    }

    quantities.set(productId, combined);
  }

  return {
    requestId,
    lines: [...quantities].sort(([a], [b]) => a - b),
  };
}

export async function createPurchase(body: unknown) {
  const { requestId, lines } = parseCart(body);
  const fingerprint = JSON.stringify(lines);

  let result: {
    id: string;
    total: number;
  };

  try {
    result = await mongoose.connection.transaction(
      async session => {
        const previous = await OrderModel
          .findOne({ requestId })
          .session(session)
          .lean();

        if (previous) {
          if (previous.fingerprint !== fingerprint) {
            throw new PurchaseError(
              409,
              'Ez a kérésazonosító már másik vásárláshoz tartozik.'
            );
          }

          return {
            id: previous.id,
            total: previous.total,
          };
        }

        const items: {
          productId: number;
          sku: string;
          name: string;
          price: number;
          quantity: number;
          subtotal: number;
        }[] = [];

        let total = 0;

        for (const [id, quantity] of lines) {
          const product = await ProductModel.findOneAndUpdate(
            {
              id,
              stock: { $gte: quantity },
            },
            {
              $inc: { stock: -quantity },
            },
            {
              returnDocument: 'after',
              runValidators: true,
              session,
            }
          ).lean();

          if (!product) {
            throw new PurchaseError(
              409,
              'Egy termék nem található, vagy nincs belőle elegendő készlet.'
            );
          }

          const subtotal = product.price * quantity;
          total += subtotal;

          if (!Number.isSafeInteger(total)) {
            throw new PurchaseError(
              400,
              'A végösszeg túl nagy.'
            );
          }

          items.push({
            productId: id,
            sku: product.sku,
            name: product.name,
            price: product.price,
            quantity,
            subtotal,
          });
        }

        const [order] = await OrderModel.create(
          [
            {
              id: randomUUID(),
              requestId,
              fingerprint,
              items,
              total,
              status: 'recorded',
            },
          ],
          { session }
        );

        return {
          id: order.id,
          total: order.total,
        };
      }
    );
  } catch (error) {
    // Két párhuzamos, azonos kérésnél az egyedi index is véd.
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 11000
    ) {
      const previous = await OrderModel
        .findOne({ requestId })
        .lean();

      if (!previous) {
        throw error;
      }

      if (previous.fingerprint !== fingerprint) {
        throw new PurchaseError(
          409,
          'Ez a kérésazonosító már másik vásárláshoz tartozik.'
        );
      }

      result = {
        id: previous.id,
        total: previous.total,
      };
    } else {
      throw error;
    }
  }

  return {
    ...result,
    products: await getProducts(),
  };
}