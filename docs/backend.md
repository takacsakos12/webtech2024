# Backend és a későbbi Angular frontend

A backend Node.js + Express + MongoDB alkalmazás. Az Angular frontend külön fejlesztési lépés; ebben a változtatásban nem készült Angular alkalmazás.

## A kód felépítése

Az `index.js` indítja a szervert, az `app.js` beállítja az Express-t. A `routes` mappában a `auth.js`, `products.js`, `cart.js` és `orders.js` tartalmazza a négy funkció útvonalait. A kosár árának kiszámítása és mentése a `services/cart.js` fájlban van, mert a kosár és a rendelés is használja. A közös ellenőrzések a `lib/http.js` fájlba kerültek.

## Indítás

Node.js 22+ és futó MongoDB szükséges. Új gépen:

```sh
npm ci
docker compose up -d --wait
npm run seed
npm run start:api
```

Ha már fut MongoDB a 27017-es porton, a Docker-indítást hagyd ki. Új regisztrációkat használunk; régi fiókokhoz nincs migráció. Meglévő adatbázist a program nem töröl.

A `start:api` kizárólag a backendet indítja: nincs HTML-kiszolgálás vagy bejelentkezési oldalra átirányítás. Az ismeretlen útvonalak JSON 404-et adnak. A meglévő `npm start` kompatibilitásból továbbra is kiszolgálja a régi felületet. A `node --env-file=.env scripts/start-api.js` beolvassa a helyi konfigurációt is.

`GET /health` adatbázis-pinget végez. Alapértelmezett port: 8080. Az `API_ONLY=1` változó a normál indításnál is bekapcsolja az API-módot. Éles környezetben HTTPS és legalább 32 karakteres, biztonságosan megadott `SESSION_SECRET` kötelező.

## Hitelesítés Angularból

Munkamenetalapú hitelesítés működik; a jelszó scrypt-hashként, a munkamenet MongoDB-ben tárolódik. A kliens nem kap JWT-t és nem tárol jelszót vagy munkamenetazonosítót localStorage-ban.

1. Induláskor `GET /api/auth/session`. Válasz: `{ user: null | { id, username, role }, csrfToken }`.
2. A backend beállítja a `fightshop.sid` HttpOnly munkamenetsütit és a JavaScriptből olvasható `XSRF-TOKEN` sütit.
3. Az Angular `HttpClient` az azonos eredetű módosító kérésekhez alapértelmezésben `X-XSRF-TOKEN` fejlécet küld. A backend ezt a munkamenetben tárolt tokennel ellenőrzi. A süti önmagában nem elég.
4. Regisztráció/belépés új munkamenetet és új XSRF-tokent hoz létre. A kilépés mindkét sütit törli. Kilépés után új belépés előtt ismét kérd le a munkamenetet.

A korábbi `X-CSRF-Token` fejléc és a régi hitelesítési végpontok továbbra is támogatottak.

### Fejlesztői proxy

A későbbi Angular projektben az API-hoz relatív URL-eket használj, például `http.get('/api/items')`. Példa `proxy.conf.json` az Angular projekt gyökerében:

```json
{
  "/api/**": {
    "target": "http://127.0.0.1:8080",
    "secure": false
  }
}
```

Angular indítás: `ng serve --proxy-config proxy.conf.json`. A `secure: false` itt a helyi HTTP fejlesztői célra vonatkozik; éles HTTPS kapcsolat tanúsítvány-ellenőrzését ne kapcsold ki. A böngésző az Angular eredetéhez küldi az `/api/...` kéréseket, a proxy továbbítja őket a backendnek. A backend nem nyit meg általános CORS-hozzáférést. Éles üzemben ugyanezt a közös eredetű `/api` útválasztást reverse proxy biztosíthatja.

## Végpontok

Minden módosító kérés JSON-t és érvényes CSRF-fejlécet vár. A pénzösszegek egész forintértékek. Az azonosítók szövegek. A dátumok JSON-ban ISO-formátumúak.

| Metódus | Útvonal                    | Tartalom / jogosultság                                      |
| ------- | -------------------------- | ----------------------------------------------------------- |
| GET     | `/api/auth/session`        | Aktuális profil és token; anonimként is használható         |
| POST    | `/api/auth/register`       | `{ username, email, password }`; 201, automatikus belépés   |
| POST    | `/api/auth/login`          | `{ username, password }`; 200                               |
| POST    | `/api/auth/logout`         | Kilépés; 200                                                |
| GET     | `/api/users/me`            | Saját profil; belépés szükséges                             |
| GET     | `/api/items`               | Nyilvános terméklista                                       |
| GET     | `/api/items/:itemId`       | Egy termék; nyilvános                                       |
| POST    | `/api/items`               | Termékfelvétel; admin szükséges                             |
| GET     | `/api/cart`                | Saját kosár: `{ items, total }`                             |
| POST    | `/api/cart/add`            | `{ itemId, quantity? }`; quantity alapértéke 1              |
| PATCH   | `/api/cart/:itemId`        | `{ quantity }`, egész 1–99                                  |
| DELETE  | `/api/cart/remove/:itemId` | Saját kosárból eltávolítás                                  |
| GET     | `/api/orders`              | Saját rendelési előzmények                                  |
| GET     | `/api/orders/:orderId`     | Saját rendelés; másé és nem létező is 404                   |
| POST    | `/api/orders`              | `{ name, address, paymentMethod: "cash_on_delivery" }`; 201 |

Termékfelvétel: `{ termek_nev, leiras, ar, img, kategoria?, gyarto? }`. A kép HTTPS-URL, az ár pozitív egész. Adminfiók létrehozása a README szerint történik; nyilvános regisztrációval adminjog nem szerezhető.

A kosár a bejelentkezett felhasználóhoz tartozik; megadott `userId` nem változtat a tulajdonosán. A rendelés árait a szerver számolja, a kosár ürítése és a rendelés mentése egy atomi adatbázis-művelet. Ismételt vagy párhuzamos rendelésleadás nem hozhat létre ugyanabból a kosárból két rendelést.

## Hibakezelés és tesztelés

Hibaválasz: `{ "message": "Magyar nyelvű hibaüzenet" }`.

- `400`: hibás bemenet vagy azonosító.
- `401`: nincs bejelentkezve / hibás belépés.
- `403`: hibás CSRF-token vagy hiányzó adminjog.
- `404`: nem létező erőforrás; más felhasználó rendelése is ilyen.
- `409`: foglalt név/e-mail vagy párhuzamos kosármódosítás; kérd le újra az állapotot.
- `413`: túl nagy kérés (maximum 16 KiB).
- `429`: túl sok belépési/regisztrációs próbálkozás.
- `500`: belső hiba, technikai részletek nélkül.

```sh
npm run check
npm test
npm run format:check
```

A tesztek véletlen nevű, elkülönített MongoDB-adatbázisokat használnak és törölnek. Az Angular-kompatibilis süti/fejléc-folyamatot HTTP-szinten ellenőrzik; Angular alkalmazás még nincs. A bemutató nem végez valódi fizetést, készletfoglalást vagy kiszállítást.
