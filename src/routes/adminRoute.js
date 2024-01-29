const express = require('express')
const { auth, isAdmin } = require('../middlewares/auth')
const {
  registerDoctor,
  registerAdmin,
  login,
  getAllDoc,
  prescriptionFormMake,
} = require('../controllers/adminController')

const router = express.Router()

router.post('/login', login);
router.post('/register_admin', registerAdmin);
router.post('/register_doctor', auth, isAdmin, registerDoctor);

router.get('/get_all_doctor', auth, isAdmin, getAllDoc);
router.get('/get-pres-form', auth, isAdmin, prescriptionFormMake);

module.exports = router
