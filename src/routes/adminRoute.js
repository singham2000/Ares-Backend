const express = require('express');
const { auth } = require('../middlewares/auth');
const { registerDoctor } = require('../controllers/adminController');

const router = express.Router();
router.post("/register_doctor", registerDoctor);

module.exports = router;
