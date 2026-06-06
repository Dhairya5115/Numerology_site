const Appointment = require('../models/Appointment');
const AppointmentPackage = require('../models/AppointmentPackage');
const {
    BUSINESS_START_MINUTES,
    BUSINESS_END_MINUTES,
    minutesToTime,
    parseSlotRange,
    checkOverlap
} = require('../utils/constants');

/**
 * Get available slots for a selected date based on package duration
 * GET /api/appointments/available-slots?date=YYYY-MM-DD&durationMinutes=X
 */
const getAvailableSlots = async (req, res) => {
    try {
        const { date, durationMinutes } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'Date query parameter is required' });
        }

        const duration = parseInt(durationMinutes, 10) || 30;

        // Query all active (not Cancelled) appointments on the selected date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const bookedAppointments = await Appointment.find({
            scheduledDate: { $gte: startOfDay, $lte: endOfDay },
            appointmentStatus: { $nin: ['Cancelled'] }
        });

        // Generate candidate slots within business hours
        const availableSlots = [];
        let current = BUSINESS_START_MINUTES;

        while (current + duration <= BUSINESS_END_MINUTES) {
            const start = current;
            const end = current + duration;
            const slotStr = `${minutesToTime(start)} - ${minutesToTime(end)}`;

            // Check if this candidate slot overlaps with any existing booked appointment
            let isOverlapping = false;
            for (const appt of bookedAppointments) {
                try {
                    const bookedRange = parseSlotRange(appt.scheduledTime);
                    if (checkOverlap(start, end, bookedRange.start, bookedRange.end)) {
                        isOverlapping = true;
                        break;
                    }
                } catch (err) {
                    console.error('Error parsing booked appointment slot:', appt.scheduledTime, err.message);
                }
            }

            if (!isOverlapping) {
                availableSlots.push(slotStr);
            }
            
            // Advance by duration to make slots back-to-back
            current += duration;
        }

        return res.status(200).json({
            date,
            durationMinutes: duration,
            availableSlots
        });
    } catch (error) {
        console.error('Error fetching available slots:', error);
        return res.status(500).json({ error: 'Failed to calculate available slots' });
    }
};

/**
 * Get all active appointment packages/pricing plans
 * GET /api/appointments/packages
 */
const getPackages = async (req, res) => {
    try {
        const packages = await AppointmentPackage.find({ isActive: true }).sort({ price: 1 });
        return res.status(200).json(packages);
    } catch (error) {
        console.error('Error fetching packages:', error);
        return res.status(500).json({ error: 'Failed to load packages' });
    }
};

module.exports = {
    getAvailableSlots,
    getPackages
};
