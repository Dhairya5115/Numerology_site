const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Public admin login
router.post('/login', adminController.login);

// Public/semi-protected logout
router.post('/logout', adminController.logout);

// Protected routes (require adminAuth middleware)
router.get('/appointments', adminController.adminAuth, adminController.getAppointments);
router.put('/appointments/:id/status', adminController.adminAuth, adminController.updateAppointmentStatus);
router.delete('/appointments/:id', adminController.adminAuth, adminController.deleteAppointment);

module.exports = router;
