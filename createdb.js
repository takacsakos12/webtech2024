const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";

const items = [
    {
        id: 1,
        "termek_nev": "Everlast Edző Kesztyű",
        "gyarto": "Everlast",
        "kategoria": "Box",
        "ar": 24990,
        "leiras": "Kiváló minőségű edző kesztyű box és fitnesz edzésekhez.",
        "img": "https://www.insportline.cz/upload/product/640x640/everlast-pro-style-elite-2312-2314.jpg.webp"
    },
    {
        id: 2,
        "termek_nev": "Fairtex Muay Thai Nadrág",
        "gyarto": "Fairtex",
        "kategoria": "Muay Thai",
        "ar": 13990,
        "leiras": "Tartós Muay Thai nadrág, amely kiváló rugalmasságot és kényelmet biztosít.",
        "img": "https://www.muaythaistores.eu/custom/twinsglovesshop/image/cache/w600h600wt1/product/fairtex/IMG_7337.webp?lastmod=1714813164.1670886106"
    },
    {
        id: 3,
        "termek_nev": "Adidas Judo Gi",
        "gyarto": "Adidas",
        "kategoria": "Judo",
        "ar": 29990,
        "leiras": "Hivatalos verseny Judo Gi megerősített varrással.",
        "img": "https://www.roninwear.com/images/adidas-judogi-club-j350-white-1.jpg"
    },
    {
        id: 4,
        "termek_nev": "Shureido Karate Öv",
        "gyarto": "Shureido",
        "kategoria": "Karate",
        "ar": 7990,
        "leiras": "Kiváló minőségű Karate öv, különböző színekben elérhető.",
        "img": "https://www.szafarisport.hu/images/units/11577-01.jpg"
    },
    {
        id: 5,
        "termek_nev": "Venum Challenger MMA Kesztyű",
        "gyarto": "Venum",
        "kategoria": "MMA",
        "ar": 19990,
        "leiras": "Tartós MMA kesztyű, ideális edzésekhez és versenyekhez.",
        "img": "https://s13emagst.akamaized.net/products/45400/45399007/images/res_80d25307d0522c52c68b54fddd9271a7.jpg"
    },
    {
        id: 6,
        "termek_nev": "Daedo Taekwondo Ruházat",
        "gyarto": "Daedo",
        "kategoria": "Taekwondo",
        "ar": 17990,
        "leiras": "Kiváló minőségű Taekwondo ruházat minden szintű gyakorló számára.",
        "img": "https://www.roninwear.com/images/daedo-ta1047-fetkd-taekwondo-dobok-white-1.jpg"
    },
    {
        id: 7,
        "termek_nev": "Ringside Box Fejvédő",
        "gyarto": "Ringside",
        "kategoria": "Box",
        "ar": 14990,
        "leiras": "Védő fejvédő box edzésekhez és sparringhoz.",
        "img": "https://img.gorillasports.hu/p/49/77655/1618468312-43110-big.jpg"
    },
    {
        id: 8,
        "termek_nev": "Cleto Reyes Edző Kesztyű",
        "gyarto": "Cleto Reyes",
        "kategoria": "Box",
        "ar": 29990,
        "leiras": "Professzionális edző kesztyű komoly boxolók számára.",
        "img": "https://senteso-cz.s11.cdn-upgates.com/_cache/a/5/a5b2cf0d0e105f6f87dd221aae08cd85-cleto-reyes-velcro-training-gloves-gold-1.jpg"
    },
    {
        id: 9,
        "termek_nev": "Top King Muay Thai Nadrág",
        "gyarto": "Top King",
        "kategoria": "Muay Thai",
        "ar": 15990,
        "leiras": "Prémium Muay Thai nadrág kiváló kényelemmel és tartóssággal.",
        "img": "https://www.muaythaitop.com/image/cache/data/CLS-015-Black-Blue-600x450.jpg"
    },
    {
        id: 10,
        "termek_nev": "Mizuno Judo Gi",
        "gyarto": "Mizuno",
        "kategoria": "Judo",
        "ar": 27990,
        "leiras": "Kiváló minőségű Judo Gi, alkalmas versenyekre és edzésekre.",
        "img": "https://judogi-shop.hu/img/91037/22EA8A0101_1-0/585x585,r/22EA8A0101_1-0.jpg?time=1660129334"
    },
    {
        id: 11,
        "termek_nev": "Hayabusa Karate Öv",
        "gyarto": "Hayabusa",
        "kategoria": "Karate",
        "ar": 6990,
        "leiras": "Tartós Karate öv edzésekhez és versenyekhez.",
        "img": "https://www.shogunfight.eu/fotky4209/fotos/_vyrn_2497pro-jiu-jitsu-belt-brown-main.jpg"
    },
    {
        id: 12,
        "termek_nev": "RDX MMA Kesztyű",
        "gyarto": "RDX",
        "kategoria": "MMA",
        "ar": 16990,
        "leiras": "Kiváló minőségű MMA kesztyű edzésekhez és profi küzdelmekhez.",
        "img": "https://respectfight.hu/custom/vitalbox/image/cache/w460h460wt1/RDX/mma_kesztyu/grappling_mma_gloves_blue_rdx.png.webp?lastmod=1717935006.1714139737"
    },
    {
        id: 13,
        "termek_nev": "Kwon Taekwondo Ruházat",
        "gyarto": "Kwon",
        "kategoria": "Taekwondo",
        "ar": 18990,
        "leiras": "Tartós és kényelmes Taekwondo ruházat minden szinten.",
        "img": "https://kwon.hu/wp-content/uploads/2019/11/1006_01_003_16-P.jpg"
    },
    {
        id: 14,
        "termek_nev": "Title Box Fejvédő",
        "gyarto": "Title",
        "kategoria": "Box",
        "ar": 15990,
        "raktarkeszlet": 15,
        "leiras": "Kiváló minőségű fejvédő box edzésekhez és sparringhoz.",
        "img": "https://webshop.legea.hu/img/10144/PLTMGP/PLTMGP.jpg"
    }
];

MongoClient.connect(url, { useUnifiedTopology: true }, function(err, db) {
    if (err) throw err;
    const dbo = db.db("store");

    dbo.createCollection("users", function(err, res) {
        if (err) throw err;
        console.log("Users collection created!");
    });

    dbo.createCollection("items", function(err, res) {
        if (err) throw err;
        console.log("Items collection created!");
        dbo.collection("items").insertMany(items, function(err, result) {
            if (err) throw err;
            console.log("Number of documents inserted: " + result.insertedCount);
            db.close();
        });
    });
});
