// routes/issueRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const { reportIssue } = require("../controllers/issueController");
const { assignWorker } = require('../controllers/issueController');
router.put('/assign/:id', verifyToken, verifyAdmin, assignWorker);

const { getAssignedIssues, updateIssueStatus } = require("../controllers/issueController");

router.get("/assigned", verifyToken, getAssignedIssues); // only worker can access
router.put("/update-status/:id", verifyToken, updateIssueStatus);

router.post("/report", protect, upload.single("image"), reportIssue);

module.exports = router;
