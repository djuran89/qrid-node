const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/profile");

router.get("/login", ctrl.isLogin);
router.get("/notification", ctrl.notification);

router.post("/send", ctrl.send);
router.post("/login", ctrl.login);
router.post("/logout", ctrl.logout);
router.post("/create", ctrl.create);

router.post("/code/send", ctrl.sendConfirmCode);
router.post("/code/confirm", ctrl.cofirmCode);

router.put("/notification", ctrl.notifictionRead);

module.exports = router;
