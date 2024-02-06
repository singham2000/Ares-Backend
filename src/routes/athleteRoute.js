const express = require("express");
const {
  login,
  register,
  sendForgotPasswordCode,
  validateForgotPasswordCode,
  resetPassword,
  getProfile,
} = require("../controllers/atheleteController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

router.post("/send-forgot-password-code", sendForgotPasswordCode);
router.post("/validate-code", validateForgotPasswordCode);
router.post("/register", register);
router.post("/login", login);

router.put("/reset-password", resetPassword);
router.get("/get-profile", auth, getProfile);
module.exports = router;
