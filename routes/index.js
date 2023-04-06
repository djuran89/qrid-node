const express = require("express");
const router = express.Router();

const profileRouter = require("./profile");
const qrCodeRouter = require("./qrcode");
const visionRouter = require("./vision");

router.use("/profile", profileRouter);
router.use("/qrcode", qrCodeRouter);
router.use("/vision", visionRouter);

module.exports = router;
