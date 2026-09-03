const { Router } = require("express");
const authRoutes = require("./authRoutes");

const router = Router();

router.use("/", authRoutes);

module.exports = router;