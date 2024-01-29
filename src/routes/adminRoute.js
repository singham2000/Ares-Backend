const express = require('express');
const { auth } = require('../middlewares/auth');
const {
    registerDoctor,
    registerAdmin,
    login,
    getAllDoc
} = require('../controllers/adminController');

const router = express.Router();
router.post("/register_doctor", registerDoctor);
router.post("/register_admin", registerAdmin);
router.post("/login", login);
router.get("/get_all_doctor", getAllDoc)

module.exports = router;
