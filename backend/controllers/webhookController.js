const RazorpayWebhook = require('../models/RazorpayWebhook');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const User = require('../models/User');
const AppointmentPackage = require('../models/AppointmentPackage');
const nodemailerTransporter = require('../config/nodemailer');

/**
 * Send Confirmation Emails (Helper copied from paymentController to keep webhookController independent)
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
                <p style="color: #666; font-size: 0.9em; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                    &copy; 2026 AuraNumerology. All paths aligned.
                </p>
            </div>
        `
    };

    const adminMailOptions = {
        from: fromSender,
        to: adminEmail,
        subject: `New Booking: ${pack.title} - ${user.name} (via Webhook)`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; color: #333;">
                <h2 style="color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">New Consultation Request (Verified via Webhook)</h2>
                
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
                
                <p style="font-size: 0.85em; color: #888;">Transaction verified via Razorpay Webhook</p>
            </div>
        `
    };

    try {
        await nodemailerTransporter.sendMail(clientMailOptions);
        console.log(`[Webhook] Confirmation email sent to client: ${user.email}`);

        await nodemailerTransporter.sendMail(adminMailOptions);
        console.log(`[Webhook] Alert email sent to admin: ${adminEmail}`);
    } catch (error) {
        console.error('[Webhook] Nodemailer failed to send emails:', error);
    }
};

/**
 * Handle incoming webhooks from Razorpay
 * POST /api/webhooks
 */
const handleWebhook = async (req, res) => {
    try {
        // Log basic incoming webhook info for diagnostics
        console.log('[Webhook] Received headers:', JSON.stringify(req.headers));
        console.log('[Webhook] Received body (first 1000 chars):', JSON.stringify(req.body).slice(0, 1000));

        const eventId = req.body.id;
        const eventType = req.body.event;

        if (!eventId || !eventType) {
            return res.status(400).json({ error: 'Invalid webhook payload structure' });
        }

        // Check if event already logged/processed to prevent duplicate processing
        const existingWebhook = await RazorpayWebhook.findOne({ eventId });
        if (existingWebhook) {
            console.log(`Webhook event ${eventId} already exists in DB. Skipping.`);
            return res.status(200).json({ status: 'already_processed' });
        }

        // Parse Razorpay payload
        const paymentPayload = req.body.payload && req.body.payload.payment;
        const paymentEntity = paymentPayload && paymentPayload.entity;

        const razorpayPaymentId = paymentEntity ? paymentEntity.id : null;
        const razorpayOrderId = paymentEntity ? paymentEntity.order_id : null;

        // Log the webhook initial state in DB
        const webhookLog = new RazorpayWebhook({
            eventId,
            eventType,
            razorpayPaymentId,
            razorpayOrderId,
            payload: req.body,
            processed: false
        });

        // Resolve associated appointment
        let appointment = null;
        if (razorpayOrderId) {
            appointment = await Appointment.findOne({ razorpayOrderId });
            if (appointment) {
                webhookLog.appointmentId = appointment._id;
            }
        }

        // Process webhook if it confirms a payment capture
        if (eventType === 'payment.captured' || eventType === 'order.paid') {
            if (appointment) {
                // Check if appointment is not yet confirmed/paid
                if (appointment.paymentStatus !== 'Paid') {
                    appointment.paymentStatus = 'Paid';
                    appointment.appointmentStatus = 'Confirmed';
                    await appointment.save();

                    // Create Payment record if not exists
                    let payment = await Payment.findOne({ razorpayPaymentId });
                    if (!payment) {
                        payment = new Payment({
                            appointmentId: appointment._id,
                            amount: appointment.amount,
                            razorpayOrderId,
                            razorpayPaymentId,
                            razorpaySignature: 'razorpay_webhook_verified',
                            status: 'Paid',
                            paidAt: paymentEntity.created_at ? new Date(paymentEntity.created_at * 1000) : new Date()
                        });
                        await payment.save();
                    }

                    // Retrieve User and Package to send confirmation emails
                    const user = await User.findById(appointment.userId);
                    const pack = await AppointmentPackage.findById(appointment.packageId);
                    if (user && pack) {
                        if (user.paymentStatus !== 'paid') {
                            user.paymentStatus = 'paid';
                            await user.save();
                        }
                        sendEmailNotifications(appointment, user, pack);
                    }
                }
                webhookLog.processed = true;
                webhookLog.processedAt = new Date();
            } else {
                console.warn(`[Webhook] Received payment capture for order ${razorpayOrderId} but no matching Appointment found in DB.`);
            }
        }

        await webhookLog.save();
        return res.status(200).json({ status: 'ok', eventId });
    } catch (error) {
        console.error('Razorpay Webhook handler error:', error);
        return res.status(500).json({ error: 'Failed to process webhook' });
    }
};

module.exports = {
    handleWebhook
};
