import { afterNextRender, Component, ElementRef, input, output, viewChild } from '@angular/core';

import { CurrencyPipe } from '@angular/common';
import { Product } from '../../models/product';

@Component({
  selector: 'app-order-summary',
  imports: [CurrencyPipe],

  template: `
    <dialog
      #dialog
      aria-labelledby="order-title"
      aria-describedby="order-description"
      (cancel)="handleCancel($event)"
    >
      <div class="dialog-heading">
        <div>
          <p class="eyebrow">Már csak egy lépés</p>
          <h2 id="order-title">Rendelés összesítése</h2>
        </div>

        <button
          type="button"
          class="close-button"
          aria-label="Rendelési ablak bezárása"
          [disabled]="busy()"
          (click)="closed.emit()"
        >
          ✕
        </button>
      </div>

      <p id="order-description" class="description">
        Ellenőrizd a kosarad tartalmát a véglegesítés előtt.
      </p>

      <ul class="order-items">
        @for (item of items(); track item.id) {
          <li>
            <div>
              <strong>{{ item.name }}</strong>

              <p class="item-details">
                {{ item.quantity }} db ×
                {{ item.price | currency: 'HUF' : 'Ft' : '1.0-0' : 'hu' }}
              </p>
            </div>

            <strong class="line-total">
              {{ item.price * item.quantity | currency: 'HUF' : 'Ft' : '1.0-0' : 'hu' }}
            </strong>
          </li>
        }
      </ul>

      <div class="total">
        <span>Végösszeg</span>

        <strong>
          {{ total() | currency: 'HUF' : 'Ft' : '1.0-0' : 'hu' }}
        </strong>
      </div>

      <p class="demo-notice">
        Bemutatórendelés: a készlet csökken, de valódi fizetés és kiszállítás nem történik.
      </p>

      @if (invalid() && !retry()) {
        <p class="error" role="alert">
          Néhány termékből nincs elegendő készlet. Lépj vissza a kosárhoz, és módosítsd a
          mennyiségeket.
        </p>
      }

      @if (errorMessage()) {
        <p class="error" role="alert">{{ errorMessage() }}</p>
      }

      @if (busy()) {
        <p role="status">A rendelés feldolgozása folyamatban…</p>
      }

      <div class="actions">
        <button type="button" class="secondary" [disabled]="busy()" (click)="closed.emit()">
          Vissza a kosárhoz
        </button>

        <button
          type="button"
          [disabled]="busy() || !items().length || (invalid() && !retry())"
          (click)="confirmed.emit()"
        >
          {{
            busy()
              ? 'Feldolgozás…'
              : retry()
                ? 'Rendelés újrapróbálása'
                : 'Bemutatórendelés véglegesítése'
          }}
        </button>
      </div>
    </dialog>
  `,

  styles: `
    dialog {
      box-sizing: border-box;
      width: min(620px, calc(100% - 32px));
      max-height: calc(100dvh - 32px);
      overflow-y: auto;
      padding: 28px;
      border: 1px solid #d5dce5;
      border-radius: 18px;
      background: #fff;
      color: #202b38;
      box-shadow: 0 24px 80px #0004;
    }

    dialog::backdrop {
      background: rgb(15 23 42 / 65%);
    }

    .dialog-heading {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .eyebrow {
      margin: 0 0 6px;
      color: #a33d00;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    h2 {
      margin: 0;
      font-size: clamp(1.4rem, 4vw, 1.8rem);
    }

    .description,
    .item-details {
      color: #526071;
    }

    .order-items {
      padding: 0;
      margin: 24px 0;
      list-style: none;
    }

    .order-items li {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding: 16px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .order-items strong {
      overflow-wrap: anywhere;
    }

    .item-details {
      margin: 6px 0 0;
      font-size: 0.9rem;
    }

    .line-total {
      flex-shrink: 0;
    }

    .total {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 1.2rem;
    }

    .demo-notice {
      padding: 14px;
      margin: 24px 0;
      border-left: 3px solid #b54400;
      border-radius: 6px;
      background: #fff4e8;
      line-height: 1.5;
    }

    .error {
      color: #a51c30;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 24px;
    }

    button {
      min-height: 44px;
      padding: 10px 16px;
      border: 1px solid transparent;
      border-radius: 8px;
      background: #ff9234;
      color: #171717;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }

    .secondary,
    .close-button {
      border-color: #cbd5e1;
      background: #fff;
      color: #202b38;
    }

    .close-button {
      flex-shrink: 0;
      min-width: 44px;
      padding: 8px;
    }

    button:focus-visible {
      outline: 3px solid #1d4ed8;
      outline-offset: 3px;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @media (max-width: 480px) {
      dialog {
        padding: 20px;
      }

      .actions {
        flex-direction: column-reverse;
      }

      .actions button {
        width: 100%;
      }
    }
  `,
})
export class OrderSummary {
  items = input.required<(Product & { quantity: number })[]>();
  total = input.required<number>();

  busy = input(false);
  invalid = input(false);
  retry = input(false);
  errorMessage = input('');

  confirmed = output<void>();
  closed = output<void>();

  private dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    afterNextRender(() => {
      this.dialog().nativeElement.showModal();
    });
  }

  handleCancel(event: Event) {
    event.preventDefault();

    if (!this.busy()) {
      this.closed.emit();
    }
  }
}
