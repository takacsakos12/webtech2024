import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { Product } from '../models/product';

export interface PurchaseResult {
  id: string;
  total: number;
  products: Product[];
}

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private http = inject(HttpClient);

  getProducts() {
    return this.http.get<Product[]>('/api/products').pipe(timeout(10000));
  }

  purchase(requestId: string, items: { productId: number; quantity: number }[]) {
    return this.http
      .post<PurchaseResult>('/api/products/demo-purchase', {
        requestId,
        items,
      })
      .pipe(timeout(10000));
  }
}
