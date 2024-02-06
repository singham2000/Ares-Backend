const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Notification Title is Required"],
    },
    text: {
      type: String,
      required: [true, "Notification text is Required"],
    },
    athlete: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Athlete",
    },
    seen: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
