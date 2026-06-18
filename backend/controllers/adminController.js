const crypto = require('crypto');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Payment = require('../models/Payment');
const AppointmentPackage = require('../models/AppointmentPackage');

// In-memory set to store valid admin session tokens
const activeSessions = new Set();

/**
 * Admin authentication middleware
 */
const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!activeSessions.has(token)) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    next();
};

/**
 * POST /api/admin/login
 * Admin login verification
 */
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
        const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

        if (username === expectedUsername && password === expectedPassword) {
            const token = crypto.randomBytes(32).toString('hex');
            activeSessions.add(token);
            return res.status(200).json({ success: true, token });
        } else {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ error: 'Server error during login' });
    }
};

/**
 * POST /api/admin/logout
 * Admin logout (invalidate token)
 */
const logout = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            activeSessions.delete(token);
        }
        return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Admin logout error:', error);
        return res.status(500).json({ error: 'Server error during logout' });
    }
};

/**
 * GET /api/admin/appointments
 * Retrieve all bookings joined with User, Plan, and Payment info
 */
const getAppointments = async (req, res) => {
    try {
        // Retrieve all appointments sorted by creation date descending
        const appointments = await Appointment.find()
            .populate('userId')
            .populate('packageId')
            .sort({ createdAt: -1 });

        // Retrieve corresponding payment details in a single query
        const apptIds = appointments.map(appt => appt._id);
        const payments = await Payment.find({ appointmentId: { $in: apptIds } });
        
        // Map appointment ID to payment details for fast lookup
        const paymentMap = new Map();
        payments.forEach(p => {
            paymentMap.set(p.appointmentId.toString(), p.razorpayPaymentId);
        });

        // Format the results to output precisely what the UI table needs
        const formattedAppointments = appointments.map((appt, index) => {
            const user = appt.userId || {};
            const pack = appt.packageId || {};
            
            // Format Birth Details nice and clean
            const dob = user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : 'N/A';
            const birthTime = user.birthTime || 'N/A';
            const birthPlace = user.birthPlace || 'N/A';

            return {
                id: appt._id,
                sNo: index + 1,
                name: user.name || 'N/A',
                email: user.email || 'N/A',
                phone: user.phone || 'N/A',
                birthDetails: `${dob} (${birthTime}) at ${birthPlace}`,
                question: appt.question || 'N/A',
                appointmentStatus: appt.appointmentStatus || 'Pending',
                paymentStatus: appt.paymentStatus || 'Pending',
                plan: pack.title || 'N/A',
                price: appt.amount || pack.price || 0,
                paymentId: paymentMap.get(appt._id.toString()) || 'N/A',
                scheduledDate: appt.scheduledDate ? new Date(appt.scheduledDate).toISOString().split('T')[0] : 'N/A',
                scheduledTime: appt.scheduledTime || 'N/A',
                createdAt: appt.createdAt
            };
        });

        return res.status(200).json(formattedAppointments);
    } catch (error) {
        console.error('Error fetching admin appointments:', error);
        return res.status(500).json({ error: 'Failed to retrieve appointments' });
    }
};

/**
 * PUT /api/admin/appointments/:id/status
 * Update an appointment status
 */
const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { appointmentStatus: status },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        return res.status(200).json({ success: true, message: 'Status updated successfully', appointment });
    } catch (error) {
        console.error('Error updating appointment status:', error);
        return res.status(500).json({ error: 'Failed to update status' });
    }
};

/**
 * DELETE /api/admin/appointments/:id
 * Delete an appointment, its payment, and clean up the user if they have no other appointments
 */
const deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        const userId = appointment.userId;

        // 1. Delete associated payments
        await Payment.deleteMany({ appointmentId: id });

        // 2. Delete the appointment
        await Appointment.findByIdAndDelete(id);

        // 3. Clean up the user if they have no other appointments remaining
        if (userId) {
            const appointmentCount = await Appointment.countDocuments({ userId });
            if (appointmentCount === 0) {
                await User.findByIdAndDelete(userId);
            }
        }

        return res.status(200).json({ success: true, message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        return res.status(500).json({ error: 'Failed to delete appointment' });
    }
};

module.exports = {
    adminAuth,
    login,
    logout,
    getAppointments,
    updateAppointmentStatus,
    deleteAppointment
};
