const fs = require("fs");
const express = require("express");
const cors = require("cors");
const env = require("dotenv").config();
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const app = express();

// SESSION
const store = new MongoDBStore({ uri: process.env.MONGODB_URI, collection: "sessions" });
const sessionConfig = session({
	secret: process.env.SESSION_SECRET,
	saveUninitialized: false,
	resave: false,
	cookie: { domain: false },
	store,
});

// CROS
const crosConfig = cors({
	origin: process.env.CORSS_ORIGIN.split(","),
	methods: ["GET", "POST", "PUT", "DELETE"],
	credentials: true,
});

// ROUTE
const mainRoute = require("../routes/index");

// APP CONFIGURATION
app.use(sessionConfig);
app.use(crosConfig);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/", mainRoute);

module.exports = app;
