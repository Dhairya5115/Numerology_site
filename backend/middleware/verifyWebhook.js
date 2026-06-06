const crypto = require('crypto');

/**
 * Middleware to verify that the webhook request came from Razorpay.
 */
module.exports = (req, res, next) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        if (!signature) {
            return res.status(400).json({ error: 'Missing Razorpay signature header (x-razorpay-signature)' });
        }

        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';
        
        // Use rawBody if populated by express.json() custom verifier, else fallback
        const payload = req.rawBody || JSON.stringify(req.body);

        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(payload);
        const expectedSignature = hmac.digest('hex');

        if (expectedSignature !== signature) {
            console.error('Razorpay webhook signature verification failed.');
            return res.status(400).json({ error: 'Invalid webhook signature' });
        }

        next();
    } catch (error) {
        console.error('Error in webhook verification middleware:', error);
        return res.status(500).json({ error: 'Internal server error verifying webhook signature' });
    }
};
