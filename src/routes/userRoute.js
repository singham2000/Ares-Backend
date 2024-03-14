const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  login,
  getProfile,
  sendForgotPasswordCode,
  validateForgotPasswordCode,
  resetPassword,
  editClientProfile,
  editDoctorProfile,
  updatePassword,
  registerClient,
  checkClient,
  bookAppointment,
  recentBookings,
  recentPrescriptions,
  inQueueRequests,
  selectPlan,
  getEvalForm,
  getPresForm,
  getAppointment,
  getSlots,
  getAllDoc,
  getPlans,
  getAllAppointments,
  appointmentStatus
} = require("../controllers/userController");

const router = express.Router();

router.post("/login", login);
router.post("/send-forgot-password-code", sendForgotPasswordCode);
router.post("/validate-code", validateForgotPasswordCode);
router.post("/new-client-registration", auth, registerClient);
router.post("/existing-client-verification", auth, checkClient);
router.post("/book-appointment/:id", auth, bookAppointment);
router.post("/select-plan", auth, selectPlan);

router.get("/get-slots", auth, getSlots);
router.get("/get-profile", auth, getProfile);
router.get("/recent-bookings", auth, recentBookings);
router.get("/recent-prescriptions", auth, recentPrescriptions);
router.get("/in-queue-requests", auth, inQueueRequests);
router.get("/get-eval-form", auth, getEvalForm);
router.get("/get-pres-form", auth, getPresForm);
router.get("/appointments/:date", auth, getAppointment);
router.get('/get-all-doctors', auth, getAllDoc);
router.get('/getServiceTypes', auth, getPlans);
router.get('/get-all-appointments', auth, getAllAppointments);

router.put("/reset-password", resetPassword);
router.put("/update-profile-client", auth, editClientProfile);
router.put("/update-profile-doctor", auth, editDoctorProfile);
router.put("/update-password", auth, updatePassword);
router.put('/update-status-appointment', auth, appointmentStatus);

module.exports = router;
