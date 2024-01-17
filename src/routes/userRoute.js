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
    recentPrescriptions
} = require('../controllers/userController');

const router = express.Router();

router.post("/login", login);
router.post("/send-forgot-password-code", sendForgotPasswordCode);
router.post("/validate-code", validateForgotPasswordCode);
router.put("/reset-password", resetPassword);

router.get("/get-profile", auth, getProfile);

router.put("/update-profile", auth, updateProfile);
router.put("/update-password", auth, updatePassword);
router.post("/new-client-registration", auth, registerClient);
router.post("/existing-client-verification", auth, checkClient);
router.post("/book-appointment/:id", auth, bookAppointment);
router.get("/recent-bookings", auth, recentBookings);
router.get("/recent-prescriptions", auth, recentPrescriptions);

module.exports = router;
