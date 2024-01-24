const express = require('express');
const { auth } = require('../middlewares/auth');
const {
    login,
    getProfile,
    sendForgotPasswordCode,
    validateForgotPasswordCode,
    resetPassword,
    updateProfile,
    updatePassword,
    registerClient,
    checkClient,
    bookAppointment,
    recentBookings,
    recentPrescriptions,
    inQueueRequests,
    selectPlan,
    getEvalForm,
    getAppointment
} = require('../controllers/userController');

const router = express.Router();

router.post("/login", login);
router.post("/send-forgot-password-code", sendForgotPasswordCode);
router.post("/validate-code", validateForgotPasswordCode);
router.post("/new-client-registration", auth, registerClient);
router.post("/existing-client-verification", auth, checkClient);
router.post("/book-appointment/:id", auth, bookAppointment);
router.post("/select-plan", auth, selectPlan);

router.get("/get-profile", auth, getProfile);
router.get("/recent-bookings", auth, recentBookings);
router.get("/recent-prescriptions", auth, recentPrescriptions);
router.get("/in-queue-requests", auth, inQueueRequests);
router.get("/get-eval-form", auth, getEvalForm);
router.get("/appointments/:date", auth, getAppointment);

router.put("/reset-password", resetPassword);
router.put("/update-profile", auth, updateProfile);
router.put("/update-password", auth, updatePassword);

module.exports = router;
