const fs = require("fs");
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const mainRouter = require("./../routes/index");
app.use("/", mainRouter);

module.exports = app;
