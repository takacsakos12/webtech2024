export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  image: string;
}

// Bemutatóraktár: szerverújraindításkor visszaáll.
export const products: Product[] = [
  {
    id: 1,
    sku: "MMA-TEE-001",
    name: "MMA edzőpóló",
    category: "Ruházat",
    description: "Fekete edzőpóló. A kép illusztráció.",
    price: 8990,
    stock: 12,
    image: "/images/products/mma-shirt.png",
  },
  {
    id: 2,
    sku: "MMA-WRAP-001",
    name: "Boxbandázs",
    category: "Felszerelés",
    description: "Bandázs edzéshez. A kép illusztráció.",
    price: 3990,
    stock: 3,
    image: "/images/products/boxing-wraps.png",
  },
  {
    id: 3,
    sku: "MMA-BAG-001",
    name: "Sporttáska",
    category: "Kiegészítő",
    description: "Fekete sporttáska. A kép illusztráció.",
    price: 14990,
    stock: 0,
    image: "/images/products/gym-bag.png",
  },
];
