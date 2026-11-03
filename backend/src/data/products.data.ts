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
  {
    id: 4,
    sku: "MMA-GLOVE-001",
    name: "Boxkesztyű",
    category: "Felszerelés",
    description:
      "Fekete edzőkesztyű narancssárga részletekkel. A kép illusztráció.",
    price: 19990,
    stock: 8,
    image: "/images/products/boxing-gloves.png",
  },
  {
    id: 5,
    sku: "MMA-SHIN-001",
    name: "Sípcsontvédő",
    category: "Védelem",
    description:
      "Sípcsont- és lábfejvédelem technikai edzésekhez. A kép illusztráció.",
    price: 21990,
    stock: 5,
    image: "/images/products/shin-guards.png",
  },
  {
    id: 6,
    sku: "MMA-MOUTH-001",
    name: "Fogvédő tokkal",
    category: "Védelem",
    description: "Sportfogvédő tárolótokkal. A kép illusztráció.",
    price: 2990,
    stock: 20,
    image: "/images/products/mouthguard.png",
  },
  {
    id: 7,
    sku: "MMA-TEE-XL-001",
    name: "MMA edzőpóló – XL",
    category: "Ruházat",
    description: "Fekete edzőpóló XL méretben. A kép illusztráció.",
    price: 8990,
    stock: 7,
    image: "/images/products/mma-shirt.png",
  },
  {
    id: 8,
    sku: "MMA-WRAP-450-001",
    name: "Boxbandázs – 4,5 m",
    category: "Felszerelés",
    description: "Hosszabb bandázspár edzéshez. A kép illusztráció.",
    price: 4490,
    stock: 12,
    image: "/images/products/boxing-wraps.png",
  },
  {
    id: 9,
    sku: "MMA-BAG-60-001",
    name: "Sporttáska – 60 liter",
    category: "Kiegészítő",
    description: "Nagyobb edzőtáska felszerelésekhez. A kép illusztráció.",
    price: 17990,
    stock: 4,
    image: "/images/products/gym-bag.png",
  },
];
