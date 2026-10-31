# Magyar Fight Shop

Magyar nyelvű, reszponzív küzdősport-webshop Express és MongoDB alapon. Oktatási bemutató: a rendelésleadás adatokat rögzít, valós fizetés és kiszállítás nincs.

## Backend fejlesztési irány

A következő frontend Angular lesz; jelenleg a backend készül. Külön API-indítás: `npm run start:api`. Az Angular-integráció, hitelesítés és a teljes végpontlista: [Backend dokumentáció](docs/backend.md). A korábbi HTML-felület kompatibilitásból megmaradt.

## Funkciók

- Regisztráció, bejelentkezés, kijelentkezés; sózott scrypt jelszóhash és MongoDB-ben tárolt munkamenetek.
- Kereshető, sportág szerint szűrhető, ár vagy név szerint rendezhető termékkatalógus.
- Felhasználónként külön kosár, módosítható mennyiségek, szerveroldali árkalkuláció.
- Atomi rendelésrögzítés és kosárürítés; saját rendelési előzmények.
- Adminisztrátori termékfelvétel. A regisztráció mindig vásárlói fiókot hoz létre.
- CSRF-token, belépési/regisztrációs sebességkorlát, Helmet/CSP, bemeneti ellenőrzés.
- Billentyűzettel használható, magyar felület; mobilnézet; hibás külső képek helyett helyi helyettesítő kép.

## Gyors indítás

Előfeltételek: **Node.js 22 vagy újabb**, npm, **MongoDB 7**. A CI Node.js 24-gyel és MongoDB 7.0.16-tal fut.

```sh
npm ci
docker compose up -d --wait
npm run seed
npm start
```

Az alkalmazás a 8080-as porton indul. A `docker compose` csak a fejlesztői adatbázist indítja; a Node-alkalmazás a gazdagépen fut. Ha már fut MongoDB a 27017-es porton, használd azt, ne indíts második példányt ugyanarra a portra.

A `seed` ismételten futtatható: 14 mintaterméket hoz létre, a meglévő termékeket nem írja felül, a kosarakat és felhasználókat nem törli. Nem hoz létre alapértelmezett fiókot vagy jelszót.

```sh
npm run dev  # automatikus újraindítás szervermódosításkor
```

### Környezeti változók

Másold a `.env.example` fájlt `.env` néven; ez Git által figyelmen kívül hagyott helyi fájl. A Node csak külön kapcsolóval olvassa be:

```sh
node --env-file=.env index.js
```

| Változó            | Alapérték / jelentés                                             |
| ------------------ | ---------------------------------------------------------------- |
| `MONGODB_URI`      | `mongodb://127.0.0.1:27017/store`                                |
| `PORT`             | `8080`                                                           |
| `HOST`             | `0.0.0.0`                                                        |
| `NODE_ENV`         | Éles üzemhez `production`                                        |
| `SESSION_SECRET`   | Éles üzemben kötelező, legalább 32 karakteres véletlen titok     |
| `TRUST_PROXY`      | `1` kizárólag egy megbízható reverse proxy mögött; egyébként `0` |
| `TEST_MONGODB_URI` | Tesztek MongoDB-szervere; alapértelmezésben helyi 27017          |

A fejlesztői munkamenettitok minden indításkor véletlen, ezért szerverújraindítás után újra be kell jelentkezni. Állandó `SESSION_SECRET` mellett a MongoDB-ben tárolt munkamenetek újraindítás után is érvényesek. Éles módban HTTPS szükséges a `Secure` munkamenetsütihez. Titkot soha ne commitolj.

### Adminisztrátor

Új, külön adminfiókot hozhatsz létre az `ADMIN_USERNAME`, `ADMIN_EMAIL` és `ADMIN_PASSWORD` környezeti változókkal. A jelszó 10–128 karakter legyen. Ezeket biztonságos környezeti beállításon keresztül vagy a helyi, nem követett `.env` fájlban add meg, majd:

```sh
node --env-file=.env scripts/create-admin.js
```

A parancs nem ír felül és nem emel jogosultságot meglévő fiókon. Bejelentkezett adminként a katalógus alján jelenik meg a termékfelviteli űrlap.

### Frissítés a régi verzióról

Készíts adatbázis-mentést, állítsd le a régi alkalmazást, telepítsd a függőségeket, majd futtasd:

```sh
npm ci
npm run migrate:users
npm run seed
npm start
```

A migráció a régi olvasható jelszavakat scrypt-hashre cseréli és eltávolítja a `password` mezőt. A régi kosarat `legacyCart` néven megőrzi, az új kosár üresen indul. A régi külön `cart` kollekciót nem módosítja. Az eredeti program által már törölt katalógustermékeket az új alkalmazás nem tudja automatikusan visszaállítani; a mintatermékek a `seed` paranccsal pótolhatók.

A migráció normalizált név/e-mail ütközésnél módosítás előtt leáll. Az ütközéseket kézzel kell feloldani. A régi, 10 karakternél rövidebb jelszavakat is migrálja, az új regisztrációkra az erősebb követelmény vonatkozik. Meglévő felhasználó csak migráció után tud belépni. A migráció és a seed megismételhető.

## Ellenőrzés

Futó MongoDB szükséges; minden integrációs és böngészőteszt véletlen nevű, külön adatbázist hoz létre, majd azt törli. Az alkalmazás `store` adatbázisát nem használják.

```sh
npm run check         # JavaScript szintaxis
npm run format:check  # egységes formázás
npm test              # jelszavak, API, jogosultságok, kosár, rendelés, migráció
npx playwright install chromium
npm run test:e2e      # valódi böngésző, asztali és mobilméret
npm audit
```

Meglévő rendszer-Chromium is használható: `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`. A böngészőteszt a külső képkéréseket szándékosan blokkolja, hogy a helyi helyettesítő képet is ellenőrizze. A GitHub Actions ugyanezeket az ellenőrzéseket futtatja tiszta telepítéssel.

## API

Minden módosító kéréshez munkamenetsüti és `X-CSRF-Token` fejléc kell. A tokent a `GET /api/session` adja vissza; sikeres belépés/regisztráció új munkamenetet és új tokent ad. Hibaválasz: `{ "message": "…" }`.

| Művelet                 | Végpont                           | Jogosultság                                                            |
| ----------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| Állapot, adatbázis-ping | `GET /health`                     | Nyilvános                                                              |
| Munkamenet, CSRF-token  | `GET /api/session`                | Nyilvános                                                              |
| Regisztráció            | `POST /register`                  | Nyilvános, CSRF-védelemmel                                             |
| Belépés                 | `POST /login`                     | Nyilvános, CSRF-védelemmel                                             |
| Kilépés                 | `POST /api/logout`                | Munkamenet, CSRF-védelemmel                                            |
| Saját profil            | `GET /api/users/me`               | Bejelentkezett                                                         |
| Katalógus               | `GET /api/items`                  | Nyilvános                                                              |
| Termékfelvitel          | `POST /api/items/add`             | Admin                                                                  |
| Saját kosár             | `GET /api/cart`                   | Bejelentkezett                                                         |
| Kosárba helyezés        | `POST /api/cart/add`              | Bejelentkezett; `itemId`, opcionális `quantity`                        |
| Mennyiség               | `PATCH /api/cart/:itemId`         | Bejelentkezett; `quantity`: 1–99                                       |
| Eltávolítás             | `DELETE /api/cart/remove/:itemId` | Bejelentkezett                                                         |
| Saját rendelések        | `GET /api/orders`                 | Bejelentkezett                                                         |
| Rendelésleadás          | `POST /api/orders`                | Bejelentkezett; `name`, `address`, `paymentMethod: "cash_on_delivery"` |

A korábbi nyilvános felhasználólista és tetszőleges felhasználóazonosítóval lekért kosár megszűnt. A kliens által megadott `userId`, szerepkör és végösszeg nem ad jogosultságot, és nem határozza meg a rendelés árát. Párhuzamos kosármódosításnál a szerver `409` választ adhat: frissítés után ismételd meg a műveletet.

## Felépítés és korlátok

- `app.js`: tesztelhető Express-alkalmazás, API és hozzáférés-ellenőrzés.
- `index.js`: adatbáziskapcsolat, munkamenettár, indítás, szabályos leállítás.
- `lib/`: adatbázis és jelszókezelés.
- `public/`: keretrendszer és CDN-szkriptek nélküli HTML/CSS/JavaScript felület.
- `scripts/`: migráció, adminlétrehozás és szintaktikai ellenőrzés.
- `test/`: API-, jelszó- és böngészőtesztek.

A kosár és a rendelések egy felhasználói dokumentumban vannak. A rendelés mentése és a kosár ürítése így egy atomi MongoDB-művelet, külön replika nélkül. A bemutató legfeljebb 100 különböző terméket enged a kosárban, termékenként 99 darabot, és 100 rendelést tárol felhasználónként. Nincs fizetés, tényleges készletfoglalás, szállításidíj-számítás, jelszó-visszaállítás, e-mail-hitelesítés vagy teljes adminisztrációs felület. A regisztráció nem kér szükségtelen születési dátumot.

A termékképek eredeti külső hivatkozások; elérhetőségük és felhasználási jogaik külön ellenőrzést igényelnek. A helyettesítő kép helyben rendelkezésre áll. Éles üzlethez külön fizetési, készletkezelési, adatkezelési és üzemeltetési tervezés szükséges.
