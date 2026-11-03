import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-shop',
  imports: [],
  templateUrl: './shop.html',
  styleUrl: './shop.css',
})
export class Shop {
  products = [
    {
      id: 1,
      name: 'MMA edzőpóló',
      category: 'Ruházat',
      description: 'Kényelmes felső edzéshez és hétköznapi viselethez.',
      price: 8990,
      visual: 'FIGHT',
    },
    {
      id: 2,
      name: 'Boxbandázs',
      category: 'Felszerelés',
      description: 'Alapdarab a következő zsákos vagy technikai edzéshez.',
      price: 3990,
      visual: 'TRAIN',
    },
    {
      id: 3,
      name: 'Sporttáska',
      category: 'Kiegészítő',
      description: 'Tartsd egy helyen az edzéshez szükséges felszerelést.',
      price: 14990,
      visual: 'READY',
    },
  ];

  search = signal('');
  cartIds = signal<number[]>([]);
  message = signal('');
  storageAvailable = signal(true);

  filteredProducts = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('hu');

    return this.products.filter((product) =>
      `${product.name} ${product.category}`.toLocaleLowerCase('hu').includes(query),
    );
  });

  cartLines = computed(() => {
    return this.products
      .map((product) => ({
        ...product,
        quantity: this.cartIds().filter((id) => id === product.id).length,
      }))
      .filter((product) => product.quantity > 0);
  });

  total = computed(() => {
    return this.cartLines().reduce((sum, product) => sum + product.price * product.quantity, 0);
  });

  constructor() {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem('mma-demo-cart') || '[]');

      if (Array.isArray(stored)) {
        const validIds = stored.filter(
          (id: unknown): id is number =>
            typeof id === 'number' && this.products.some((product) => product.id === id),
        );

        this.cartIds.set(validIds);
      }
    } catch {
      this.storageAvailable.set(false);
    }
  }

  add(id: number) {
    this.cartIds.update((ids) => [...ids, id]);
    this.saveCart();

    const product = this.products.find((product) => product.id === id);

    this.message.set(
      `${product?.name} a kosárba került. ` + `A kosárban ${this.cartIds().length} termék van.`,
    );
  }

  decrease(id: number) {
    const index = this.cartIds().indexOf(id);

    if (index === -1) return;

    this.cartIds.update((ids) => ids.filter((_value, currentIndex) => currentIndex !== index));

    this.saveCart();
    this.message.set('A mennyiséget csökkentettük.');
  }

  remove(id: number) {
    this.cartIds.update((ids) => ids.filter((itemId) => itemId !== id));
    this.saveCart();
    this.message.set('A terméket eltávolítottuk a kosárból.');
  }

  clearCart() {
    this.cartIds.set([]);
    this.saveCart();
    this.message.set('A kosarat kiürítettük.');
  }

  formatPrice(value: number) {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private saveCart() {
    try {
      localStorage.setItem('mma-demo-cart', JSON.stringify(this.cartIds()));
    } catch {
      this.storageAvailable.set(false);
    }
  }
}
