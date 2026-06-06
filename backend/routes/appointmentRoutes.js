const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// Retrieve all active appointment packages/pricing plans
router.get('/packages', appointmentController.getPackages);

// Retrieve all available slot intervals for a selected date and package duration
router.get('/available-slots', appointmentController.getAvailableSlots);

module.exports = router;
