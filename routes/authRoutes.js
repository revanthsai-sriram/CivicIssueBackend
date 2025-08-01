// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");

const { getWorkersByType } = require("../controllers/authController");
const { verifyToken, verifyAdmin } = require("../middlewares/authMiddleware");

router.get("/workers/:type", verifyToken, verifyAdmin, getWorkersByType);


router.post("/register", register);
router.post("/login", login);

module.exports = router;
