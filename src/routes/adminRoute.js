const express = require('express')
const { auth, isAdmin } = require('../middlewares/auth')
const {
  registerDoctor,
  registerAdmin,
  login,
  getAllDoc,
  prescriptionFormMake,
  evaluationFormMake,
  registerClinic,
  getAllClinics,
  createSlot,
  getAllSlots,
  delDoc,
  editDoc,
  addPlans,
  getPlans
} = require('../controllers/adminController')

const router = express.Router()

router.post('/login', login);
router.post('/register_admin', registerAdmin);
router.post('/register_doctor', auth, isAdmin, registerDoctor);
router.post('/register_clinic', auth, isAdmin, registerClinic);
router.post('/set_pres_form', auth, isAdmin, prescriptionFormMake);
router.post('/set_eval_form', auth, isAdmin, evaluationFormMake);
router.post('/create_slot', auth, isAdmin, createSlot);
router
  .route('/plans')
  .post(auth, isAdmin, addPlans)
  .put(auth, isAdmin, editDoc)
  .get(auth, isAdmin, getPlans);


router.get('/get_all_doctor', auth, isAdmin, getAllDoc);
router.get('/get_all_clinics', auth, isAdmin, getAllClinics);
router.get('/get_all_slots', auth, isAdmin, getAllSlots);

router.delete('/delete_doc', auth, isAdmin, delDoc);
router.put('/edit_doc', auth, isAdmin, editDoc);

module.exports = router
