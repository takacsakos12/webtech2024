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
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/login', (req, res) => {
    db.collection("users").findOne({ username: req.body.username, password: req.body.password }, (err, user) => {
        if (err) throw err;
        if (!user) {
            res.redirect("/hiba.html");
        } else {
            req.session.uid = user.id;
            res.redirect('/webshop.html');
        }
    });
});

app.post("/register", (req, res) => {
    const newUser = {
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        birth: req.body.birth,
        money: 500000,
        id: uuid.v4(),
        cart: []
    };

    db.collection("users").findOne({ $or: [{ username: newUser.username }, { email: newUser.email }] }, (err, user) => {
        if (err) throw err;
        if (user) {
            res.redirect("/hiba.html");
        } else {
            db.collection("users").insertOne(newUser, (err, result) => {
                if (err) throw err;
                console.log("User inserted");
                res.redirect("/sikerreg.html");
            });
        }
    });
});

app.get('/error.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'hiba.html'));
    setTimeout(() => {
        res.redirect('/');
    }, 5000); // Redirect to index.html after 5 seconds
});

app.get('*', (req, res, next) => {
    if (!req.session.uid) {
        res.redirect('/');
    } else {
        next();
    }
});
