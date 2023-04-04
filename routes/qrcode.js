const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/qrcode");

router.get("/token", ctrl.getToken);

router.post("/token", ctrl.checkToken);

router.delete("/token", ctrl.deleteToken);

module.exports = router;
