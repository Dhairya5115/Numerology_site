const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Initiate Razorpay checkout order
router.post('/order', paymentController.createOrder);

// Verify signature and finalize booking
router.post('/verify', paymentController.verifyPaymentAndBook);

module.exports = router;
