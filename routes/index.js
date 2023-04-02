const express = require("express");
const router = express.Router();

const profileRouter = require("./profile");

router.use("/profile", profileRouter);

module.exports = router;
