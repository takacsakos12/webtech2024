const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";

const items = [
    {
        id: 1,
        "termek_nev": "Everlast Edző Kesztyű",
        "gyarto": "Everlast",
        "kategoria": "Box",
        "ar": 24990,
        "raktarkeszlet": 30,
        "leiras": "Kiváló minőségű edző kesztyű box és fitnesz edzésekhez.",
        "img": "https://example.com/everlast-gloves.jpg"
    },
    {
        id: 2,
        "termek_nev": "Fairtex Muay Thai Nadrág",
        "gyarto": "Fairtex",
        "kategoria": "Muay Thai",
        "ar": 13990,
        "raktarkeszlet": 20,
        "leiras": "Tartós Muay Thai nadrág, amely kiváló rugalmasságot és kényelmet biztosít.",
        "img": "https://example.com/fairtex-shorts.jpg"
    },
    {
        id: 3,
        "termek_nev": "Adidas Judo Gi",
        "gyarto": "Adidas",
        "kategoria": "Judo",
        "ar": 29990,
        "raktarkeszlet": 15,
        "leiras": "Hivatalos verseny Judo Gi megerősített varrással.",
        "img": "https://example.com/adidas-judo-gi.jpg"
    },
    {
        id: 4,
        "termek_nev": "Shureido Karate Öv",
        "gyarto": "Shureido",
        "kategoria": "Karate",
        "ar": 7990,
        "raktarkeszlet": 50,
        "leiras": "Kiváló minőségű Karate öv, különböző színekben elérhető.",
        "img": "https://example.com/shureido-belt.jpg"
    },
    {
        id: 5,
        "termek_nev": "Venum Challenger MMA Kesztyű",
        "gyarto": "Venum",
        "kategoria": "MMA",
        "ar": 19990,
        "raktarkeszlet": 25,
        "leiras": "Tartós MMA kesztyű, ideális edzésekhez és versenyekhez.",
        "img": "https://example.com/venum-gloves.jpg"
    },
    {
        id: 6,
        "termek_nev": "Daedo Taekwondo Ruházat",
        "gyarto": "Daedo",
        "kategoria": "Taekwondo",
        "ar": 17990,
        "raktarkeszlet": 30,
        "leiras": "Kiváló minőségű Taekwondo ruházat minden szintű gyakorló számára.",
        "img": "https://example.com/daedo-uniform.jpg"
    },
    {
        id: 7,
        "termek_nev": "Ringside Box Fejvédő",
        "gyarto": "Ringside",
        "kategoria": "Box",
        "ar": 14990,
        "raktarkeszlet": 10,
        "leiras": "Védő fejvédő box edzésekhez és sparringhoz.",
        "img": "https://example.com/ringside-headgear.jpg"
    },
    {
        id: 8,
        "termek_nev": "Cleto Reyes Edző Kesztyű",
        "gyarto": "Cleto Reyes",
        "kategoria": "Box",
        "ar": 29990,
        "raktarkeszlet": 20,
        "leiras": "Professzionális edző kesztyű komoly boxolók számára.",
        "img": "https://example.com/cleto-reyes-gloves.jpg"
    },
    {
        id: 9,
        "termek_nev": "Top King Muay Thai Nadrág",
        "gyarto": "Top King",
        "kategoria": "Muay Thai",
        "ar": 15990,
        "raktarkeszlet": 25,
        "leiras": "Prémium Muay Thai nadrág kiváló kényelemmel és tartóssággal.",
        "img": "https://example.com/top-king-shorts.jpg"
    },
    {
        id: 10,
        "termek_nev": "Mizuno Judo Gi",
        "gyarto": "Mizuno",
        "kategoria": "Judo",
        "ar": 27990,
        "raktarkeszlet": 10,
        "leiras": "Kiváló minőségű Judo Gi, alkalmas versenyekre és edzésekre.",
        "img": "https://example.com/mizuno-judo-gi.jpg"
    },
    {
        id: 11,
        "termek_nev": "Hayabusa Karate Öv",
        "gyarto": "Hayabusa",
        "kategoria": "Karate",
        "ar": 6990,
        "raktarkeszlet": 40,
        "leiras": "Tartós Karate öv edzésekhez és versenyekhez.",
        "img": "https://example.com/hayabusa-belt.jpg"
    },
    {
        id: 12,
        "termek_nev": "RDX MMA Kesztyű",
        "gyarto": "RDX",
        "kategoria": "MMA",
        "ar": 16990,
        "raktarkeszlet": 30,
        "leiras": "Kiváló minőségű MMA kesztyű edzésekhez és profi küzdelmekhez.",
        "img": "https://example.com/rdx-gloves.jpg"
    },
    {
        id: 13,
        "termek_nev": "Kwon Taekwondo Ruházat",
        "gyarto": "Kwon",
        "kategoria": "Taekwondo",
        "ar": 18990,
        "raktarkeszlet": 20,
        "leiras": "Tartós és kényelmes Taekwondo ruházat minden szinten.",
        "img": "https://example.com/kwon-uniform.jpg"
    },
    {
        id: 14,
        "termek_nev": "Title Box Fejvédő",
        "gyarto": "Title",
        "kategoria": "Box",
        "ar": 15990,
        "raktarkeszlet": 15,
        "leiras": "Kiváló minőségű fejvédő box edzésekhez és sparringhoz.",
        "img": "https://example.com/title-headgear.jpg"
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
