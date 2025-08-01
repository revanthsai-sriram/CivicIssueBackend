// models/Issue.js
const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema({
  issueType: {
    type: String,
    enum: ["Pothole", "Garbage", "Electric", "Water", "Other"],
    required: true,
  },
  title: { type: String, required: true },
  description: String,
  imageUrl: String,
  location: {
    lat: Number,
    lng: Number,
  },
  status: {
    type: String,
    enum: ["Reported", "Assigned", "In Progress", "Resolved"],
    default: "Reported",
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

module.exports = mongoose.model("Issue", issueSchema);
