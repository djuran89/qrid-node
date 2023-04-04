const express = require("express");
const router = express.Router();

const profileRouter = require("./profile");
const qrCodeRouter = require("./qrcode");

router.use("/profile", profileRouter);
router.use("/qrcode", qrCodeRouter);

module.exports = router;
