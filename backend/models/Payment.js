const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    razorpayOrderId: {
        type: String,
        required: true,
        trim: true
    },
    razorpayPaymentId: {
        type: String,
        required: true,
        trim: true
    },
    razorpaySignature: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['Paid'],
        default: 'Paid'
    },
    paidAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Payment', PaymentSchema);
