const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/profile");
const auth = require("../middleware/auth");

router.get("/", ctrl.get);
router.get("/login", ctrl.isLogin);
router.get("/notification", auth.isLogin, ctrl.notification);

router.post("/send", ctrl.send);
router.post("/login", ctrl.login);
router.post("/logout", ctrl.logout);
router.post("/create", auth.isLogin, ctrl.create);

router.post("/code/send", ctrl.sendConfirmCode);
router.post("/code/confirm", ctrl.cofirmCode);

router.put("/", auth.isLogin, ctrl.update);
router.put("/notification", auth.isLogin, ctrl.notifictionRead);

router.put("/document", auth.isLogin, ctrl.updateDocument);
router.put("/signature", auth.isLogin, ctrl.updateSignature);

module.exports = router;
