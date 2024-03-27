const mongoose = require("mongoose");

const appointmentServiceEnum = [
  "MedicalOfficeVisit",
  "SportsVision",
  "Consultation",
  "TrainingSessions",
  "ConcussionEval",
];
const paymentStatus = ["paid", "pending", "failed"];
const appointmentStatus = ["completed", "upcoming", "cancelled"];

const appointmentSchema = new mongoose.Schema(
  {
    appointment_id: {
      type: String,
      required: true,
      unique: true,
    },
    service_type: {
      type: String,
      required: true,
      enum: appointmentServiceEnum,
    },
    client: {
      type: Object,
      required: true,
    },
    app_date: {
      type: String,
      required: true,
    },
    app_time: {
      type: String,
      required: true,
    },
    end_time: {
      type: String,
      required: true,
    },
    doctor_trainer: {
      type: String,
      required: true,
    },
    location: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: paymentStatus,
      default:'N.A.'
    },
    service_status: {
      type: String,
      required: true,
      enum: appointmentStatus,
      default: 'upcoming'
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("appointment", appointmentSchema);
