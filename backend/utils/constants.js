// Business Hours in minutes from midnight (09:00 AM to 07:00 PM)
const BUSINESS_START_MINUTES = 540;  // 9 * 60
const BUSINESS_END_MINUTES = 1140;  // 19 * 60

/**
 * Converts a time string (e.g. "09:30 AM") to minutes from midnight.
 * @param {string} timeStr 
 * @returns {number}
 */
const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    
    // Regular expression to parse time formats: e.g. "09:30 AM", "9:30 AM", "14:30"
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (!match) {
        throw new Error(`Invalid time format: ${timeStr}`);
    }

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = match[3];

    if (modifier) {
        const cleanMod = modifier.toUpperCase();
        if (cleanMod === 'PM' && hours !== 12) {
            hours += 12;
        }
        if (cleanMod === 'AM' && hours === 12) {
            hours = 0;
        }
    }

    return hours * 60 + minutes;
};

/**
 * Converts minutes from midnight to a standard 12-hour time string (e.g. "09:30 AM").
 * @param {number} minutes 
 * @returns {string}
 */
const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const modifier = hours >= 12 ? 'PM' : 'AM';
    
    let displayHours = hours % 12;
    displayHours = displayHours === 0 ? 12 : displayHours;
    
    const paddedHours = String(displayHours).padStart(2, '0');
    const paddedMins = String(mins).padStart(2, '0');
    
    return `${paddedHours}:${paddedMins} ${modifier}`;
};

/**
 * Parses a slot range string (e.g. "09:00 AM - 09:30 AM") into start and end minutes.
 * @param {string} slotStr 
 * @returns {{start: number, end: number}}
 */
const parseSlotRange = (slotStr) => {
    const parts = slotStr.split(' - ');
    if (parts.length !== 2) {
        throw new Error(`Invalid slot range format: ${slotStr}`);
    }
    return {
        start: timeToMinutes(parts[0].trim()),
        end: timeToMinutes(parts[1].trim())
    };
};

/**
 * Checks if two intervals overlap.
 * @param {number} start1 
 * @param {number} end1 
 * @param {number} start2 
 * @param {number} end2 
 * @returns {boolean}
 */
const checkOverlap = (start1, end1, start2, end2) => {
    return start1 < end2 && start2 < end1;
};

module.exports = {
    BUSINESS_START_MINUTES,
    BUSINESS_END_MINUTES,
    timeToMinutes,
    minutesToTime,
    parseSlotRange,
    checkOverlap
};
