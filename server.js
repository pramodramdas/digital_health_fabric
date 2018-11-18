require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
//app.use(express.static(path.join(__dirname,'')));

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });
mongoose.connection.once('open', () => {
    require("./src/routes/router")(app);
});

const server = app.listen(process.env.NODE_PORT, () => console.log('server listening at '+process.env.NODE_PORT));

module.exports = {
    app,
    server
};