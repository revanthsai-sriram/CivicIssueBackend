const Issue = require("../models/Issue");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const streamUpload = (req) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "civic_issues", // ✅ Keep this, no preset
        // ❌ REMOVE upload_preset completely
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(req.file.buffer).pipe(stream);
  });
};

exports.reportIssue = async (req, res) => {
  try {
    const { issueType, title, description, lat, lng } = req.body;
    const userId = req.user.id;

    let imageUrl = "";

    if (req.file) {
      const uploadResult = await streamUpload(req);
      imageUrl = uploadResult.secure_url;
    }

    const newIssue = new Issue({
      issueType,
      title,
      description,
      image: imageUrl,
      location: {
        lat,
        lng,
      },
      reportedBy: userId,
    });

    await newIssue.save();

    res.status(201).json({ message: "✅ Issue reported successfully", issue: newIssue });
  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: "Error reporting issue", error: error.message });
  }
};

exports.assignWorker = async (req, res) => {
  try {
    const { workerId } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) return res.status(404).json({ message: "Issue not found" });

    const worker = await User.findById(workerId);
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    issue.assignedTo = workerId;
    issue.status = "Assigned";

    await issue.save();

    const subject = "New Civic Complaint Assigned to You";
    const message = `
Hello ${worker.name},

You have been assigned a new civic issue.

🔹 Title: ${issue.title}
🔹 Type: ${issue.issueType}
🔹 Location: https://www.google.com/maps?q=${issue.location.lat},${issue.location.lng}

Please log in to your dashboard to view and update the status of this complaint.

Thank you,
Civic Issue Reporter System
    `;

    await sendEmail(worker.email, subject, message);

    res.status(200).json({ message: "Worker assigned and notified by email", issue });
  } catch (error) {
    res.status(500).json({ message: "Error assigning worker", error: error.message });
  }
};

exports.getAssignedIssues = async (req, res) => {
  try {
    if (req.user.role !== "worker") {
      return res.status(403).json({ message: "Access denied. Workers only." });
    }

    const issues = await Issue.find({ assignedTo: req.user.id })
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assigned issues", error: error.message });
  }
};

exports.updateIssueStatus = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Check: only assigned worker or admin can update status
    if (req.user.role !== "admin" && issue.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { status } = req.body;

    if (!["In Progress", "Resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    issue.status = status;
    await issue.save();

    res.status(200).json({ message: "Status updated successfully", issue });
  } catch (error) {
    res.status(500).json({ message: "Error updating status", error: error.message });
  }
};
