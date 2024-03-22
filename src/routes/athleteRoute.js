const express = require("express");
const {
  login,
  register,
  sendForgotPasswordCode,
  validateForgotPasswordCode,
  resetPassword,
  getProfile,
  editProfile,
  getUpcomingAppointments,
  getBookings
} = require("../controllers/atheleteController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

router.post("/send-forgot-password-code", sendForgotPasswordCode);
router.post("/validate-code", validateForgotPasswordCode);
router.post("/register", register);
router.post("/login", login);

router.get("/get-profile", auth, getProfile);
router.get("/get-bookings", auth, getBookings);
router.get("/upcoming-bookings", auth, getUpcomingAppointments);

router.put("/reset-password", resetPassword);
router.put("/edit-profile", auth, editProfile);
module.exports = router;
