const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/vision");

router.get("/", ctrl.getFromFile);
router.post("/", ctrl.get);

module.exports = router;
