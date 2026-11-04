import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { NgOptimizedImage } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { Product } from '../../models/product';
import { ProductsService } from '../../services/products.service';
import { OrderSummary } from './order-summary';

@Component({
  selector: 'app-shop',
  imports: [NgOptimizedImage, OrderSummary],
  templateUrl: './shop.html',
  styleUrl: './shop.css',
})
export class Shop implements OnInit {
  private api = inject(ProductsService);

  products = signal<Product[]>([]);
  search = signal<string>('');
  cartIds = signal<number[]>([]);

  message = signal('');
  isError = signal(false);
  storageAvailable = signal(true);

  loading = signal(true);
  loadError = signal('');
  busy = signal(false);
  purchaseKey = signal<string | null>(null);
  checkoutOpen = signal(false);

  filteredProducts = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('hu');

    return this.products().filter((product) =>
      `${product.name} ${product.category} ${product.sku}`.toLocaleLowerCase('hu').includes(query),
    );
  });

  openCheckout() {
    if (this.busy() || !this.cartLines().length) return;

    this.message.set('');
    this.isError.set(false);
    this.checkoutOpen.set(true);
  }

  closeCheckout() {
    if (this.busy()) return;

    this.checkoutOpen.set(false);
  }

  cartLines = computed(() =>
    this.products()
      .map((product) => ({
        ...product,
        quantity: this.quantity(product.id),
      }))
      .filter((product) => product.quantity > 0),
  );

  total = computed(() =>
    this.cartLines().reduce((sum, product) => sum + product.price * product.quantity, 0),
  );

  invalidCart = computed(() =>
    this.cartLines().some((product) => product.quantity > Math.min(product.stock, 99)),
  );

  canEdit = computed(() => !this.busy() && !this.purchaseKey());

  constructor() {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem('mma-demo-cart') || '[]');

      if (Array.isArray(stored)) {
        this.cartIds.set(
          stored
            .filter(
              (id: unknown): id is number =>
                typeof id === 'number' && Number.isSafeInteger(id) && id > 0,
            )
            .slice(0, 300),
        );
      }

      const key = localStorage.getItem('mma-demo-purchase-key');

      if (key && /^[0-9a-f-]{36}$/i.test(key) && this.cartIds().length) {
        this.purchaseKey.set(key);
      }
    } catch {
      this.storageAvailable.set(false);
    }
  }

  ngOnInit() {
    this.loadProducts();
  }

  async loadProducts() {
    this.loading.set(true);
    this.loadError.set('');

    try {
      const products = await firstValueFrom(this.api.getProducts());

      this.products.set(products);

      const validIds = this.cartIds().filter((id) => products.some((product) => product.id === id));

      if (validIds.length !== this.cartIds().length) {
        this.cartIds.set(validIds);
        this.purchaseKey.set(null);
        this.saveCart();
      }
    } catch {
      this.loadError.set('Nem sikerült betölteni a raktárkészletet.');
    } finally {
      this.loading.set(false);
    }
  }

  quantity(id: number) {
    return this.cartIds().filter((itemId) => itemId === id).length;
  }

  canAdd(product: Product) {
    return this.canEdit() && this.quantity(product.id) < Math.min(product.stock, 99);
  }

  addLabel(product: Product) {
    if (product.stock === 0) return 'Elfogyott';

    if (this.quantity(product.id) >= Math.min(product.stock, 99)) {
      return 'Elérhető mennyiség a kosárban';
    }

    return 'Kosárba +';
  }

  add(id: number) {
    const product = this.products().find((product) => product.id === id);

    if (!product || !this.canAdd(product)) return;

    this.cartIds.update((ids) => [...ids, id]);
    this.saveCart();

    this.notify(`${product.name} a kosárba került. ` + `Kosár: ${this.cartIds().length} db.`);
  }

  decrease(id: number) {
    if (!this.canEdit()) return;

    const index = this.cartIds().indexOf(id);

    this.cartIds.update((ids) => ids.filter((_value, currentIndex) => currentIndex !== index));

    this.saveCart();
    this.notify('A mennyiséget csökkentettük.');
  }

  remove(id: number) {
    if (!this.canEdit()) return;

    this.cartIds.update((ids) => ids.filter((itemId) => itemId !== id));

    this.saveCart();
    this.notify('A terméket eltávolítottuk.');
  }

  clearCart() {
    if (!this.canEdit()) return;

    this.cartIds.set([]);
    this.saveCart();
    this.notify('A kosarat kiürítettük.');
  }

  async purchase() {
    if (this.busy() || !this.cartLines().length || (this.invalidCart() && !this.purchaseKey())) {
      return;
    }

    this.busy.set(true);

    const key = this.purchaseKey() || crypto.randomUUID();

    this.purchaseKey.set(key);
    this.saveCart();

    try {
      const items = this.cartLines().map((product) => ({
        productId: product.id,
        quantity: product.quantity,
      }));

      const result = await firstValueFrom(this.api.purchase(key, items));

      this.products.set(result.products);
      this.cartIds.set([]);
      this.purchaseKey.set(null);
      this.saveCart();

      this.checkoutOpen.set(false);

      this.notify(
        `Sikeres bemutatóvásárlás: ${this.formatPrice(result.total)}. ` +
          'A raktárkészlet csökkent.',
      );
    } catch (error) {
      if (error instanceof HttpErrorResponse && [400, 409].includes(error.status)) {
        this.purchaseKey.set(null);
        this.saveCart();

        this.notify(
          typeof error.error?.message === 'string'
            ? error.error.message
            : 'A kosár készlete megváltozott.',
          true,
        );

        try {
          this.products.set(await firstValueFrom(this.api.getProducts()));
        } catch {
          this.notify(
            'A vásárlás nem sikerült, a friss készlet sem érhető el. ' + 'Frissítsd az oldalt.',
            true,
          );
        }
      } else {
        this.notify(
          'A vásárlás eredménye nem ellenőrizhető. ' +
            'Az újrapróbálás ugyanazt a kérésazonosítót használja.',
          true,
        );
      }
    } finally {
      this.busy.set(false);
    }
  }

  formatPrice(value: number) {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private notify(message: string, error = false) {
    this.isError.set(error);
    this.message.set(message);
  }

  private saveCart() {
    try {
      localStorage.setItem('mma-demo-cart', JSON.stringify(this.cartIds()));

      const key = this.purchaseKey();

      if (key) {
        localStorage.setItem('mma-demo-purchase-key', key);
      } else {
        localStorage.removeItem('mma-demo-purchase-key');
      }
    } catch {
      this.storageAvailable.set(false);
    }
  }
}
