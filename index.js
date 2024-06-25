const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT || 8080;
const logger = require('./middleware/logger');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const bodyParser = require('body-parser');
const users = require('./middleware/api/users');
const items = require('./middleware/api/items');
const basket = require('./middleware/api/basket');

app.use(cookieParser());
app.use(expressSession({
    secret: 'logininfo',
    resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(logger);
app.use('/api/users', users);
app.use('/api/items', items);
app.use('/api/basket', basket);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
