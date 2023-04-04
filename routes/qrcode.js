const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/qrcode");

router.get("/token", ctrl.getToken);

module.exports = router;
