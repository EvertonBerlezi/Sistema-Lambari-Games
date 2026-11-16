const { Router } = require("express");
const c = require("../controllers/authController");
const router = Router();
router.post("/login", c.login);
router.post("/cadastro", c.cadastro);
module.exports = router;
