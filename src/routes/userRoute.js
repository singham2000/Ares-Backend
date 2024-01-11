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
    registerClient
} = require('../controllers/userController');

const router = express.Router();

router.post("/login", login);
router.post("/send-forgot-password-code", sendForgotPasswordCode);
router.post("/validate-code", validateForgotPasswordCode);
router.put("/reset-password", resetPassword);

router.get("/get-profile", auth, getProfile);

router.put("/update-profile", auth, updateProfile);
router.put("/update-password", auth, updatePassword);
router.put("/new-client-registration", auth, registerClient);

module.exports = router;
