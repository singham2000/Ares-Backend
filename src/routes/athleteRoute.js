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
  getBookings, getTransactions, dashboard
} = require("../controllers/atheleteController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

router.post("/send-forgot-password-code", sendForgotPasswordCode);
router.post("/validate-code", validateForgotPasswordCode);
router.post("/register", register);
router.post("/login", login);

router.get("/get-profile", auth, getProfile);
router.route('/transaction').get(auth, getTransactions);
router.get("/get-bookings", auth, getBookings);
router.get("/upcoming-bookings", auth, getUpcomingAppointments);

router.put("/reset-password", resetPassword);
router.put("/edit-profile", auth, editProfile);
router.route('/dashboard').get(auth, dashboard);


module.exports = router;
