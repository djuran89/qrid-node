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

// APP CONFIGURATION
app.use(sessionConfig);
app.use(crosConfig);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// ROUTE
const mainRoute = require("../routes/index");
app.use("/api", mainRoute);

module.exports = app;
