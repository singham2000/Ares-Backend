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
} = require("../controllers/atheleteController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

router.post("/send-forgot-password-code", sendForgotPasswordCode);
router.post("/validate-code", validateForgotPasswordCode);
router.post("/register", register);
router.post("/login", login);

router.get("/get-profile", auth, getProfile);

router.put("/reset-password", resetPassword);
router.put("/edit-profile", auth, editProfile);
router.get("/upcoming-bookings", auth, getUpcomingAppointments);
module.exports = router;
