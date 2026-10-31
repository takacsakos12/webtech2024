# Termékfotók és mintatermékek

A `data/products.json` 30 mintaterméket tartalmaz, a következő sportágakhoz: Box, Muay Thai, MMA, Judo, Karate, Taekwondo. A 16 új termék bemutatótermék, nem valódi gyártói ajánlat. Az árak szemléltető adatok, nem ellenőrzött piaci árak. A méretlista tájékoztató adat; a kosár még nem választ és nem foglal méret szerinti készletet.

## Képek állapota

**Ellenőrzött szabad felhasználású fotó még nincs hozzárendelve.** A korábbi kereskedői kép-URL-ek felhasználási engedélyét nem tudtuk igazolni, ezért az új mintaadatok nem tartalmazzák ezeket. Az `img` jelenleg `null`, az `imageStatus` értéke `pending_license_verification`. A későbbi frontend ebből tudja, hogy helyettesítő kép szükséges.

A Wikimedia Commons forrásoldalait a futó környezet HTTP-proxyja 403-mal blokkolta. A következő domainek hozzáadását elmentettük a hálózati piszkozatba; mentésük nem azonos a futó hálózati hozzáférés engedélyezésével:

- `commons.wikimedia.org`: keresés, fájlleírás és egyedi licencadatok.
- `upload.wikimedia.org`: a képfájlok.

Az engedélyezés után minden kiválasztott képnél külön ellenőrizni kell:

1. A fájl ténylegesen fotó-e, és az adott felszerelést ábrázolja-e.
2. A szerző neve, eredeti fájlleíró oldal és az adott fájl pontos licence.
3. Kereskedelmi használat és módosítás engedélyezett-e; a Commons nem egyetlen licencet alkalmaz minden képre.
4. A szükséges forrásmegjelölés és esetleges megosztásazonos feltételek.
5. Általános felszerelésfotó esetén egyértelműen illusztrációként kell kezelni; nem állítható, hogy a képen egy konkrét márka adott modellje látható.

Elfogadható jelöltek például igazolt közkincs/CC0 képek vagy megfelelő forrásmegjelöléssel használható CC BY / CC BY-SA fotók. Egy weboldal vagy fotó ingyenes elérhetősége önmagában nem felhasználási engedély.

A jóváhagyott fotókhoz a későbbiekben a termék mellett érdemes tárolni a szerzőt, fájlforrást, licencazonosítót, licenc-URL-t és a módosítás leírását is. Ezeket ellenőrzés nélkül ne töltsük ki kitalált adatokkal.

## Betöltés

`npm run seed` új adatbázisban 30 terméket hoz létre. Meglévő adatbázisnál csak a hiányzó mintaazonosítókat pótolja; a meglévő termékek képeit és egyéb mezőit nem írja felül. Így a régebben betöltött termékekhez továbbra is tartozhat korábbi kép-URL. Új katalógus teszteléséhez használj külön fejlesztői adatbázist a `MONGODB_URI` beállításával; felhasználói adatot a seed nem töröl.
