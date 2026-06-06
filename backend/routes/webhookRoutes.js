const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const verifyWebhook = require('../middleware/verifyWebhook');

// Process incoming webhook events, protected by signature verification
router.post('/', verifyWebhook, webhookController.handleWebhook);

module.exports = router;
