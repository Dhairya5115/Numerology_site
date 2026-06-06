const crypto = require('crypto');
const razorpay = require('../config/razorpay');

/**
 * Creates a Razorpay payment order.
 * @param {number} amount - Amount in INR (not paise)
 * @param {string} receipt - Receipt reference string
 * @returns {Promise<Object>} The created order object
 */
const createOrder = async (amount, receipt) => {
    try {
        const options = {
            amount: Math.round(amount * 100), // convert to paise
            currency: 'INR',
            receipt: receipt || `rcpt_${Date.now()}`
        };
        const order = await razorpay.orders.create(options);
        return order;
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw error;
    }
};

/**
 * Verifies the signature sent back from Razorpay checkout.
 * @param {string} orderId 
 * @param {string} paymentId 
 * @param {string} signature 
 * @returns {boolean} True if signature matches
 */
const verifySignature = (orderId, paymentId, signature) => {
    try {
        const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(`${orderId}|${paymentId}`);
        const generatedSignature = hmac.digest('hex');
        return generatedSignature === signature;
    } catch (error) {
        console.error('Error verifying signature:', error);
        return false;
    }
};

module.exports = {
    createOrder,
    verifySignature
};
