const User = require('../models/User');
const AppointmentPackage = require('../models/AppointmentPackage');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const razorpayService = require('../services/razorpayService');
const transporter = require('../config/nodemailer');
const { parseSlotRange, checkOverlap } = require('../utils/constants');

/**
 * Create a Razorpay Order
 * POST /api/payments/order
 */
const createOrder = async (req, res) => {
    try {
        const { tier } = req.body;

        if (!tier) {
            return res.status(400).json({ error: 'pricing plan tier (slug) is required' });
        }

        const pack = await AppointmentPackage.findOne({ slug: tier, isActive: true });
        if (!pack) {
            return res.status(404).json({ error: `Pricing package '${tier}' not found` });
        }

        const receiptId = `rcpt_${Date.now()}`;
        const order = await razorpayService.createOrder(pack.price, receiptId);

        return res.status(200).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        return res.status(500).json({ error: 'Failed to initialize payment order' });
    }
};

/**
 * Send Confirmation and Admin Notification Emails
 */
const sendEmailNotifications = async (appointment, user, pack) => {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const fromSender = `"AuraNumerology" <${process.env.EMAIL_USER}>`;

    const formattedDate = new Date(appointment.scheduledDate).toISOString().split('T')[0];

    const clientMailOptions = {
        from: fromSender,
        to: user.email,
        subject: `Your AuraNumerology Session is Confirmed! — ${formattedDate}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; color: #333;">
                <h2 style="color: #6c5ce7; text-align: center;">Session Confirmed!</h2>
                <p>Hello <strong>${user.name}</strong>,</p>
                <p>Your booking details have been successfully received and verified. Our expert numerologist is preparing your chart.</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">Booking Summary</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px 0; color: #666;">Reading Plan:</td>
                            <td style="padding: 5px 0; font-weight: bold;">${pack.title}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; color: #666;">Date:</td>
                            <td style="padding: 5px 0; font-weight: bold;">${formattedDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; color: #666;">Time Slot:</td>
                            <td style="padding: 5px 0; font-weight: bold;">${appointment.scheduledTime}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; color: #666;">Amount Paid:</td>
                            <td style="padding: 5px 0; font-weight: bold;">₹${appointment.amount} (Paid)</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; color: #666;">Order ID:</td>
                            <td style="padding: 5px 0; font-family: monospace; font-size: 0.9em;">${appointment.razorpayOrderId}</td>
                        </tr>
                    </table>
                </div>
                <p>Please ensure you are available online during the selected slot. An invitation link will be sent to this email address shortly.</p>
                <p style="color: #666; font-size: 0.9em; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">&copy; 2026 AuraNumerology. All paths aligned.</p>
            </div>
        `
    };

    const adminMailOptions = {
        from: fromSender,
        to: adminEmail,
        subject: `New Booking: ${pack.title} - ${user.name}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; color: #333;">
                <h2 style="color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">New Consultation Request</h2>
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${user.name}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Phone:</strong> ${user.phone}</p>
                <h3>Consultation Appointment</h3>
                <p><strong>Plan Selected:</strong> ${pack.title} (₹${appointment.amount})</p>
                <p><strong>Scheduled Slot:</strong> ${formattedDate} at ${appointment.scheduledTime}</p>
                <h3>Chart Calculation Inputs</h3>
                <p><strong>Birth Date:</strong> ${user.dateOfBirth.toISOString().split('T')[0]}</p>
                <p><strong>Birth Time:</strong> ${user.birthTime}</p>
                <p><strong>Birth Place:</strong> ${user.birthPlace}</p>
                <div style="background-color: #fffde7; border-left: 4px solid #d4af37; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold;">User's Question:</p>
                    <p style="margin: 5px 0 0 0; font-style: italic;">"${appointment.question}"</p>
                </div>
                <p style="font-size: 0.85em; color: #888;">Transaction verified via Razorpay Order ID: ${appointment.razorpayOrderId}</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(clientMailOptions);
        console.log(`Booking confirmation email sent to client: ${user.email}`);

        await transporter.sendMail(adminMailOptions);
        console.log(`Booking alert email sent to admin: ${adminEmail}`);
    } catch (error) {
        console.error('Nodemailer failed to send emails:', error);
    }
};

/**
 * Verify payment signature, confirm slot is still free, record booking details, and send emails.
 * POST /api/payments/verify
 */
const verifyPaymentAndBook = async (req, res) => {
    let user = null;

    const updateUserStatus = async (status) => {
        if (!user) {
            return;
        }

        user.paymentStatus = status;
        await user.save();
    };

    try {
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            bookingDetails
        } = req.body;

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !bookingDetails) {
            return res.status(400).json({ error: 'Missing required payment verification details' });
        }

        user = new User({
            name: bookingDetails.fullName.trim(),
            email: bookingDetails.email.toLowerCase().trim(),
            phone: bookingDetails.phone.trim(),
            dateOfBirth: new Date(bookingDetails.birthDate),
            birthTime: bookingDetails.birthTime,
            birthPlace: bookingDetails.birthPlace.trim(),
            paymentStatus: 'pending'
        });
        await user.save();

        const isSignatureValid = razorpayService.verifySignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isSignatureValid) {
            await updateUserStatus('failed');
            return res.status(400).json({ error: 'Payment signature verification failed. Transaction is invalid.' });
        }

        const slotDate = bookingDetails.bookedDate;
        const slotTime = bookingDetails.bookedTime;
        const candidateRange = parseSlotRange(slotTime);

        const startOfDay = new Date(slotDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(slotDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingBookings = await Appointment.find({
            scheduledDate: { $gte: startOfDay, $lte: endOfDay },
            appointmentStatus: { $nin: ['Cancelled'] }
        });

        for (const appt of existingBookings) {
            try {
                const bookedRange = parseSlotRange(appt.scheduledTime);
                if (checkOverlap(candidateRange.start, candidateRange.end, bookedRange.start, bookedRange.end)) {
                    await updateUserStatus('failed');
                    console.warn(`Double-booking attempt prevented for date: ${slotDate}, slot: ${slotTime}`);
                    return res.status(400).json({
                        error: 'This slot has already been reserved by another user. Please select a different slot.'
                    });
                }
            } catch (err) {
                console.error('Error parsing booked appointment slot range:', appt.scheduledTime, err.message);
            }
        }

        let pack = await AppointmentPackage.findOne({ title: bookingDetails.planName });
        if (!pack) {
            const numericPrice = parseInt(bookingDetails.price.replace(/[^\d]/g, ''), 10);
            pack = await AppointmentPackage.findOne({ price: numericPrice });
        }
        if (!pack) {
            await updateUserStatus('failed');
            return res.status(400).json({ error: 'Could not resolve appointment package from booking details.' });
        }

        let appointment = await Appointment.findOne({ razorpayOrderId: razorpay_order_id });
        if (!appointment) {
            appointment = new Appointment({
                userId: user._id,
                packageId: pack._id,
                question: bookingDetails.question.trim(),
                amount: pack.price,
                paymentStatus: 'Paid',
                appointmentStatus: 'Confirmed',
                razorpayOrderId: razorpay_order_id,
                scheduledDate: new Date(slotDate),
                scheduledTime: slotTime
            });
            await appointment.save();
        } else {
            appointment.paymentStatus = 'Paid';
            appointment.appointmentStatus = 'Confirmed';
            await appointment.save();
        }

        let payment = await Payment.findOne({ razorpayPaymentId: razorpay_payment_id });
        if (!payment) {
            payment = new Payment({
                appointmentId: appointment._id,
                amount: pack.price,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                status: 'Paid',
                paidAt: new Date()
            });
            await payment.save();
        }

        await updateUserStatus('paid');
        sendEmailNotifications(appointment, user, pack);

        return res.status(200).json({
            success: true,
            message: 'Payment verified and booking confirmed successfully',
            appointment
        });
    } catch (error) {
        if (user && user.paymentStatus !== 'paid') {
            try {
                await updateUserStatus('failed');
            } catch (saveError) {
                console.error('Failed to update user payment status to failed:', saveError);
            }
        }

        console.error('Payment verification and booking error:', error);
        return res.status(500).json({ error: 'An error occurred during booking validation' });
    }
};

module.exports = {
    createOrder,
    verifyPaymentAndBook
};
