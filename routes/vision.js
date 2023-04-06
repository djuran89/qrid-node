const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/vision");

router.get("/", ctrl.get);

module.exports = router;
