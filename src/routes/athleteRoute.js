const express = require("express");
const {
    login,
    register,
    sendForgotPasswordCode,
    validateForgotPasswordCode,
    resetPassword,
} = require("../controllers/atheleteController");

const router = express.Router();

router.post("/send-forgot-password-code", sendForgotPasswordCode);
router.post("/validate-code", validateForgotPasswordCode);
router.post("/register", register);
router.post("/login", login);

router.put("/reset-password", resetPassword);

module.exports = router;
