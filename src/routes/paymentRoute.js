const express = require("express");
const { auth } = require("../middlewares/auth");
const { createPaymentIntent } = require("../controllers/paymentHandler");
const router = express.Router();

router.post('/createPaymentIntent', createPaymentIntent);

module.exports = router;