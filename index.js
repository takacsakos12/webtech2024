const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT || 8080;
const logger = require('./middleware/logger');
const MongoClient = require("mongodb").MongoClient;
const users = require('./middleware/api/users');
const items = require('./middleware/api/items');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const bodyParser = require('body-parser');
const uuid = require("uuid");

const mongourl = "mongodb://localhost:27017/store";
let db;

MongoClient.connect(mongourl, { useUnifiedTopology: true }, (err, client) => {
    if (err) return console.log(err);
    db = client.db("store");
    app.listen(port, () => {
        console.log("Server running on port " + port);
    });
});

app.use(cookieParser());
app.use(expressSession({
    secret: 'logininfo',
    resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));
app.use(logger);

app.use("/api/users", users);
app.use("/api/items", items);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    if (!req.session.uid) {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    } else {
        res.redirect('/webshop.html');
    }
});

app.post('/login', (req, res) => {
    db.collection("users").findOne(req.body, (err, user) => {
        if (err) throw err;
        if (!user) {
            res.redirect("/error.html");
        } else {
            req.session.uid = user.id;
            res.redirect('/webshop.html');
        }
    });
});

app.post("/register", (req, res) => {
    req.body['money'] = 500000; 
    req.body["id"] = uuid.v4();
    req.body["cart"] = [];
    db.collection("users").insertOne(req.body, (err, result) => {
        if (err) throw err;
        console.log("User inserted");
        res.redirect("/sikerreg.html");
    });
});

app.get('*', (req, res, next) => {
    if (!req.session.uid) {
        res.redirect('/');
    } else {
        next();
    }
});
