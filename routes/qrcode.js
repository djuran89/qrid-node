const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/qrcode");

router.get("/token", ctrl.getToken);

router.post("/token/expire", ctrl.isTokenExpire);

router.delete("/token", ctrl.deleteToken);

module.exports = router;
