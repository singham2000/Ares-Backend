const express = require('express')
const { auth, isAdmin } = require('../middlewares/auth')
const {
  registerDoctor,
  registerAdmin,
  login,
  getAllDoc,
  prescriptionFormMake,
  evaluationFormMake
} = require('../controllers/adminController')

const router = express.Router()

router.post('/login', login);
router.post('/register_admin', registerAdmin);
router.post('/register_doctor', auth, isAdmin, registerDoctor);
router.post('/set_pres_form', auth, isAdmin, prescriptionFormMake);
router.post('/set_eval_form', auth, isAdmin, evaluationFormMake);

router.get('/get_all_doctor', auth, isAdmin, getAllDoc);

module.exports = router
