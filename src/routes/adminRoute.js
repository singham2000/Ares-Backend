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
  addSlot,
  getAllSlots,
  delDoc,
  delUser,
  editDoc,
  addPlans,
  getPlans,
  editPlan,
  delPlan,
  registerAthlete,
  getAllUsers,
  activateUser,
  activateClinic,
  getBookings
} = require('../controllers/adminController')

const router = express.Router()

router.post('/login', login);
router.post('/register_admin', registerAdmin);
router.post('/register_doctor', auth, isAdmin, registerDoctor);
router.post('/register_athlete', auth, isAdmin, registerAthlete);
router.post('/register_clinic', auth, isAdmin, registerClinic);
router.post('/set_pres_form', auth, isAdmin, prescriptionFormMake);
router.post('/set_eval_form', auth, isAdmin, evaluationFormMake);
router.post('/add_slot', auth, isAdmin, addSlot);
router
  .route('/plans')
  .post(auth, isAdmin, addPlans)
  .put(auth, isAdmin, editPlan)
  .get(auth, isAdmin, getPlans)
  .delete(auth, isAdmin, delPlan)

router.delete('/delete_user', auth, isAdmin, delUser);

router.get('/make_active_user', auth, isAdmin, activateUser);
router.get('/make_active_clinic', auth, isAdmin, activateClinic);
router.get('/get_bookings', auth, isAdmin, getBookings);
router.get('/get_all_doctor', auth, isAdmin, getAllDoc);
router.get('/get_all_clinics', auth, isAdmin, getAllClinics);
router.get('/get_all_slots', auth, isAdmin, getAllSlots);
router.get('/get_all_users', auth, isAdmin, getAllUsers);

router.delete('/delete_doc', auth, isAdmin, delDoc);
router.put('/edit_doc', auth, isAdmin, editDoc);

module.exports = router
