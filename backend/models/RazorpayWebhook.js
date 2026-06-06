const mongoose = require('mongoose');

const RazorpayWebhookSchema = new mongoose.Schema({
    eventId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    eventType: {
        type: String,
        required: true,
        trim: true
    },
    razorpayPaymentId: {
        type: String,
        trim: true
    },
    razorpayOrderId: {
        type: String,
        trim: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    payload: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    processed: {
        type: Boolean,
        default: false
    },
    processedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('RazorpayWebhook', RazorpayWebhookSchema);
