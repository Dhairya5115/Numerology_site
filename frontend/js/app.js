document.addEventListener('DOMContentLoaded', () => {
    // API Server Config
    const API_BASE_URL = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || '/api';

    // Navigation / Views Elements
    const landingView = document.getElementById('landing-view');
    const bookingView = document.getElementById('booking-view');
    const successView = document.getElementById('success-view');
    const backBtn = document.getElementById('back-btn');
    const headerLogo = document.getElementById('header-logo');
    const resetBtn = document.getElementById('reset-btn');
    
    // Form Summary Elements
    const summaryTier = document.getElementById('summary-tier');
    const summaryDuration = document.getElementById('summary-duration');
    const summaryDateTime = document.getElementById('summary-date-time');
    const summaryPrice = document.getElementById('summary-price');

    // Details Form & Inputs
    const detailsForm = document.getElementById('details-form');
    const fullNameInput = document.getElementById('full-name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const birthDateInput = document.getElementById('birth-date');
    const birthTimeInput = document.getElementById('birth-time');
    const birthPlaceInput = document.getElementById('birth-place');
    const questionInput = document.getElementById('question');
    const birthDateTrigger = document.getElementById('birth-date-trigger');
    const birthDateDisplay = document.getElementById('birth-date-display');
    const birthDatePopover = document.getElementById('birth-date-popover');
    const birthDateMonthLabel = document.getElementById('birth-date-month-label');
    const birthDateMonthSelect = document.getElementById('birth-date-month-select');
    const birthDateYearSelect = document.getElementById('birth-date-year-select');
    const birthDateGrid = document.getElementById('birth-date-grid');
    const birthDatePrev = document.getElementById('birth-date-prev');
    const birthDateNext = document.getElementById('birth-date-next');
    const birthTimeTrigger = document.getElementById('birth-time-trigger');
    const birthTimeDisplay = document.getElementById('birth-time-display');
    const birthTimePopover = document.getElementById('birth-time-popover');
    const birthTimeHourGrid = document.getElementById('birth-time-hour-grid');
    const birthTimeMinuteGrid = document.getElementById('birth-time-minute-grid');
    const bookingDateTrigger = document.getElementById('booking-date-trigger');
    const bookingDateDisplay = document.getElementById('booking-date-display');
    const bookingDatePopover = document.getElementById('booking-date-popover');
    const bookingDateMonthLabel = document.getElementById('booking-date-month-label');
    const bookingDateMonthSelect = document.getElementById('booking-date-month-select');
    const bookingDateYearSelect = document.getElementById('booking-date-year-select');
    const bookingDateGrid = document.getElementById('booking-date-grid');
    const bookingDatePrev = document.getElementById('booking-date-prev');
    const bookingDateNext = document.getElementById('booking-date-next');
    const bookingTimeTrigger = document.getElementById('booking-time-trigger');
    const bookingTimeDisplay = document.getElementById('booking-time-display');
    const bookingTimePopover = document.getElementById('booking-time-popover');
    const bookingTimeGrid = document.getElementById('booking-time-grid');
    
    // Booking Date & Time inputs
    const bookingDateInput = document.getElementById('booking-date');
    const bookingTimeInput = document.getElementById('booking-time');

    // Success Screen Receipt Elements
    const receiptTier = document.getElementById('receipt-tier');
    const receiptTime = document.getElementById('receipt-time');
    const receiptName = document.getElementById('receipt-name');
    const calculatingOverlay = document.querySelector('.calculating-overlay');

    // State
    let selectedPlan = {
        tier: '',
        name: '',
        price: '',
        duration: '',
        durationMinutes: 30
    };

    // Initialize display states
    landingView.style.display = 'block';
    bookingView.style.display = 'none';
    successView.style.display = 'none';

    // Transition Helper Function
    function transitionView(fromElement, toElement) {
        fromElement.classList.remove('active');
        
        setTimeout(() => {
            fromElement.style.display = 'none';
            toElement.style.display = toElement === successView ? 'flex' : 'block';
            toElement.offsetHeight; 
            toElement.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 350);
    }

    // Set Date input constraints (Min date: today)
    const today = new Date().toISOString().split('T')[0];
    birthDateInput.max = today;

    function formatCalendarDate(dateValue) {
        if (!dateValue) return '';

        const [year, month, day] = dateValue.split('-').map(Number);
        const dateObject = new Date(year, month - 1, day);
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(dateObject);
    }

    function toLocalISODate(dateObject) {
        const year = dateObject.getFullYear();
        const month = String(dateObject.getMonth() + 1).padStart(2, '0');
        const day = String(dateObject.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatTimeLabel(timeValue) {
        if (!timeValue) return '';

        const matchesAMPM = timeValue.match(/(AM|PM)/i);
        const cleaned = timeValue.replace(/(AM|PM)/i, '').trim();
        const parts = cleaned.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);

        if (isNaN(hours) || isNaN(minutes)) return timeValue;

        let suffix = '';
        if (matchesAMPM) {
            suffix = matchesAMPM[0].toUpperCase();
        } else {
            suffix = hours >= 12 ? 'PM' : 'AM';
        }

        const normalizedHours = hours % 12 || 12;
        return `${normalizedHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
    }

    function formatDisplayDate(dateValue) {
        if (!dateValue) return 'Choose date';
        return formatCalendarDate(dateValue);
    }

    function minutesToTimeValue(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentYear = new Date().getFullYear();
    const birthYearRangeStart = 1900;
    const birthYearRangeEnd = currentYear;
    const bookingYearRangeStart = currentYear;
    const bookingYearRangeEnd = currentYear + 2;

    function buildMonthOptions(selectElement) {
        selectElement.innerHTML = monthNames.map((monthName, index) => `
            <option value="${index}">${monthName}</option>
        `).join('');
    }

    function buildYearOptions(selectElement, startYear, endYear) {
        const years = [];
        for (let year = startYear; year <= endYear; year += 1) {
            years.push(`<option value="${year}">${year}</option>`);
        }
        selectElement.innerHTML = years.join('');
    }

    function syncDateControls(monthSelect, yearSelect, viewDate) {
        monthSelect.value = String(viewDate.getMonth());
        yearSelect.value = String(viewDate.getFullYear());
    }

    function clampDateView(viewDate, minYear, maxYear) {
        const year = Math.min(Math.max(viewDate.getFullYear(), minYear), maxYear);
        const month = Math.min(Math.max(viewDate.getMonth(), 0), 11);
        return new Date(year, month, 1);
    }

    function closePicker(groupElement, popoverElement, triggerElement) {
        groupElement.classList.remove('is-open');
        popoverElement.hidden = true;
        triggerElement.setAttribute('aria-expanded', 'false');
    }

    function openPicker(groupElement, popoverElement, triggerElement) {
        groupElement.classList.add('is-open');
        popoverElement.hidden = false;
        triggerElement.setAttribute('aria-expanded', 'true');
    }

    function syncBirthDateSelection(dateValue) {
        birthDateInput.value = dateValue;
        birthDateDisplay.innerText = formatCalendarDate(dateValue) || 'Choose your birth date';
        birthDateInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function syncBirthTimeSelection(timeValue) {
        birthTimeInput.value = timeValue;
        birthTimeDisplay.innerText = formatTimeLabel(timeValue) || 'Choose your birth time';
        birthTimeInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function syncBookingDateSelection(dateValue) {
        bookingDateInput.value = dateValue;
        bookingDateDisplay.innerText = formatDisplayDate(dateValue);
        bookingDateInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function syncBookingTimeSelection(timeValue) {
        bookingTimeInput.value = timeValue;
        bookingTimeDisplay.innerText = formatTimeLabel(timeValue) || 'Choose time slot';
        bookingTimeInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    let birthDateViewDate = birthDateInput.value
        ? new Date(`${birthDateInput.value}T00:00:00`)
        : new Date();

    function renderBirthDateCalendar(viewDate = birthDateViewDate) {
        birthDateViewDate = clampDateView(viewDate, birthYearRangeStart, birthYearRangeEnd);

        const monthStart = birthDateViewDate;
        syncDateControls(birthDateMonthSelect, birthDateYearSelect, monthStart);

        const currentMonthKey = new Date().getFullYear() * 12 + new Date().getMonth();
        const viewMonthKey = monthStart.getFullYear() * 12 + monthStart.getMonth();
        birthDateNext.disabled = viewMonthKey >= currentMonthKey;
        birthDatePrev.disabled = monthStart.getFullYear() <= birthYearRangeStart && monthStart.getMonth() === 0;

        const firstDayIndex = monthStart.getDay();
        const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
        const selectedDate = birthDateInput.value;
        const todayValue = toLocalISODate(new Date());

        const cells = [];
        for (let index = 0; index < firstDayIndex; index += 1) {
            cells.push('<span class="calendar-empty" aria-hidden="true"></span>');
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            const currentDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
            const dateValue = toLocalISODate(currentDate);
            const isPastToday = dateValue > todayValue;
            const isSelected = dateValue === selectedDate;
            const isToday = dateValue === todayValue;

            cells.push(`
                <button type="button"
                    class="calendar-day${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}"
                    data-date="${dateValue}"
                    ${isPastToday ? 'disabled' : ''}>
                    ${day}
                </button>
            `);
        }

        birthDateGrid.innerHTML = cells.join('');
    }

    let birthHour = birthTimeInput.value ? birthTimeInput.value.split(':')[0] : '';
    let birthMinute = birthTimeInput.value ? birthTimeInput.value.split(':')[1] : '';
    let bookingDateViewDate = bookingDateInput.value
        ? new Date(`${bookingDateInput.value}T00:00:00`)
        : new Date();
    let bookingTimeValues = [];

    function updateBirthTimeValue() {
        if (birthHour === '' || birthMinute === '') return;
        const combinedValue = `${birthHour}:${birthMinute}`;
        syncBirthTimeSelection(combinedValue);
    }

    function renderBirthTimeGrid() {
        const hourButtons = [];
        for (let hour = 0; hour < 24; hour += 1) {
            const hourValue = String(hour).padStart(2, '0');
            const displayHour = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
            const isSelected = hourValue === birthHour;
            hourButtons.push(`
                <button type="button" class="time-slot-btn${isSelected ? ' selected' : ''}" data-hour="${hourValue}">
                    ${displayHour}
                </button>
            `);
        }

        const minuteButtons = [];
        for (let minute = 0; minute < 60; minute += 1) {
            const minuteValue = String(minute).padStart(2, '0');
            const isSelected = minuteValue === birthMinute;
            minuteButtons.push(`
                <button type="button" class="time-slot-btn${isSelected ? ' selected' : ''}" data-minute="${minuteValue}">
                    ${minuteValue}
                </button>
            `);
        }

        birthTimeHourGrid.innerHTML = hourButtons.join('');
        birthTimeMinuteGrid.innerHTML = minuteButtons.join('');
    }

    function renderAppointmentDateCalendar(viewDate = bookingDateViewDate) {
        bookingDateViewDate = clampDateView(viewDate, bookingYearRangeStart, bookingYearRangeEnd);

        const monthStart = bookingDateViewDate;
        syncDateControls(bookingDateMonthSelect, bookingDateYearSelect, monthStart);

        const currentMonthKey = new Date().getFullYear() * 12 + new Date().getMonth();
        const viewMonthKey = monthStart.getFullYear() * 12 + monthStart.getMonth();
        const minMonthKey = new Date(today).getFullYear() * 12 + new Date(today).getMonth();

        bookingDatePrev.disabled = viewMonthKey <= minMonthKey;
        bookingDateNext.disabled = viewMonthKey >= currentMonthKey + 12;

        const firstDayIndex = monthStart.getDay();
        const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
        const selectedDate = bookingDateInput.value;
        const minDateValue = today;

        const cells = [];
        for (let index = 0; index < firstDayIndex; index += 1) {
            cells.push('<span class="calendar-empty" aria-hidden="true"></span>');
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            const currentDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
            const dateValue = toLocalISODate(currentDate);
            const isBeforeMin = dateValue < minDateValue;
            const isSelected = dateValue === selectedDate;
            const isToday = dateValue === minDateValue;

            cells.push(`
                <button type="button"
                    class="calendar-day${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}"
                    data-date="${dateValue}"
                    ${isBeforeMin ? 'disabled' : ''}>
                    ${day}
                </button>
            `);
        }

        bookingDateGrid.innerHTML = cells.join('');
    }

    function renderAppointmentTimeGrid() {
        const selectedDateValue = bookingDateInput.value;
        const slots = bookingTimeValues.length > 0
            ? bookingTimeValues
            : [
                '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
                '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
                '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
                '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
                '05:00 PM', '05:30 PM', '06:00 PM'
            ];

        bookingTimeGrid.innerHTML = slots.map(slot => `
            <button type="button" class="time-slot-btn${slot === bookingTimeInput.value ? ' selected' : ''}" data-time="${slot}">
                ${slot}
            </button>
        `).join('');

        bookingTimeTrigger.disabled = !selectedDateValue;
        bookingTimeDisplay.innerText = selectedDateValue ? (bookingTimeInput.value || 'Choose time slot') : 'Select date first';
    }

    function closeAllBirthPickers() {
        closePicker(birthDateTrigger.closest('.custom-picker-group'), birthDatePopover, birthDateTrigger);
        closePicker(birthTimeTrigger.closest('.custom-picker-group'), birthTimePopover, birthTimeTrigger);
        closePicker(bookingDateTrigger.closest('.custom-picker-group'), bookingDatePopover, bookingDateTrigger);
        closePicker(bookingTimeTrigger.closest('.custom-picker-group'), bookingTimePopover, bookingTimeTrigger);
    }

    if (birthDateInput.value) {
        syncBirthDateSelection(birthDateInput.value);
    }

    if (birthTimeInput.value) {
        syncBirthTimeSelection(birthTimeInput.value);
    }

    buildMonthOptions(birthDateMonthSelect);
    buildMonthOptions(bookingDateMonthSelect);
    buildYearOptions(birthDateYearSelect, birthYearRangeStart, birthYearRangeEnd);
    buildYearOptions(bookingDateYearSelect, bookingYearRangeStart, bookingYearRangeEnd);

    renderBirthDateCalendar();
    renderBirthTimeGrid();
    renderAppointmentDateCalendar();
    renderAppointmentTimeGrid();

    birthDateTrigger.addEventListener('click', () => {
        const groupElement = birthDateTrigger.closest('.custom-picker-group');
        const isOpen = groupElement.classList.contains('is-open');
        closeAllBirthPickers();

        if (!isOpen) {
            renderBirthDateCalendar(birthDateInput.value ? new Date(`${birthDateInput.value}T00:00:00`) : birthDateViewDate);
            openPicker(groupElement, birthDatePopover, birthDateTrigger);
        }
    });

    birthTimeTrigger.addEventListener('click', () => {
        const groupElement = birthTimeTrigger.closest('.custom-picker-group');
        const isOpen = groupElement.classList.contains('is-open');
        closeAllBirthPickers();

        if (!isOpen) {
            renderBirthTimeGrid();
            openPicker(groupElement, birthTimePopover, birthTimeTrigger);
        }
    });

    bookingDateTrigger.addEventListener('click', () => {
        const groupElement = bookingDateTrigger.closest('.custom-picker-group');
        const isOpen = groupElement.classList.contains('is-open');
        closeAllBirthPickers();

        if (!isOpen) {
            renderAppointmentDateCalendar(bookingDateInput.value ? new Date(`${bookingDateInput.value}T00:00:00`) : bookingDateViewDate);
            openPicker(groupElement, bookingDatePopover, bookingDateTrigger);
        }
    });

    bookingTimeTrigger.addEventListener('click', () => {
        if (bookingTimeTrigger.disabled) return;

        const groupElement = bookingTimeTrigger.closest('.custom-picker-group');
        const isOpen = groupElement.classList.contains('is-open');
        closeAllBirthPickers();

        if (!isOpen) {
            renderAppointmentTimeGrid();
            openPicker(groupElement, bookingTimePopover, bookingTimeTrigger);
        }
    });

    birthDatePrev.addEventListener('click', () => {
        birthDateViewDate = new Date(birthDateViewDate.getFullYear(), birthDateViewDate.getMonth() - 1, 1);
        renderBirthDateCalendar(birthDateViewDate);
    });

    birthDateNext.addEventListener('click', () => {
        const currentMonthKey = new Date().getFullYear() * 12 + new Date().getMonth();
        const nextMonth = new Date(birthDateViewDate.getFullYear(), birthDateViewDate.getMonth() + 1, 1);
        const nextMonthKey = nextMonth.getFullYear() * 12 + nextMonth.getMonth();

        if (nextMonthKey <= currentMonthKey) {
            birthDateViewDate = nextMonth;
            renderBirthDateCalendar(birthDateViewDate);
        }
    });

    birthDateMonthSelect.addEventListener('change', () => {
        birthDateViewDate = new Date(Number(birthDateYearSelect.value), Number(birthDateMonthSelect.value), 1);
        renderBirthDateCalendar(birthDateViewDate);
    });

    birthDateYearSelect.addEventListener('change', () => {
        birthDateViewDate = new Date(Number(birthDateYearSelect.value), Number(birthDateMonthSelect.value), 1);
        renderBirthDateCalendar(birthDateViewDate);
    });

    bookingDatePrev.addEventListener('click', () => {
        const previousMonth = new Date(bookingDateViewDate.getFullYear(), bookingDateViewDate.getMonth() - 1, 1);
        if (previousMonth >= new Date(today)) {
            bookingDateViewDate = previousMonth;
            renderAppointmentDateCalendar(bookingDateViewDate);
        }
    });

    bookingDateNext.addEventListener('click', () => {
        bookingDateViewDate = new Date(bookingDateViewDate.getFullYear(), bookingDateViewDate.getMonth() + 1, 1);
        renderAppointmentDateCalendar(bookingDateViewDate);
    });

    bookingDateMonthSelect.addEventListener('change', () => {
        bookingDateViewDate = new Date(Number(bookingDateYearSelect.value), Number(bookingDateMonthSelect.value), 1);
        renderAppointmentDateCalendar(bookingDateViewDate);
    });

    bookingDateYearSelect.addEventListener('change', () => {
        bookingDateViewDate = new Date(Number(bookingDateYearSelect.value), Number(bookingDateMonthSelect.value), 1);
        renderAppointmentDateCalendar(bookingDateViewDate);
    });

    birthDateGrid.addEventListener('click', (event) => {
        const dateButton = event.target.closest('[data-date]');
        if (!dateButton || dateButton.disabled) return;

        syncBirthDateSelection(dateButton.dataset.date);
        closePicker(birthDateTrigger.closest('.custom-picker-group'), birthDatePopover, birthDateTrigger);
    });

    birthTimeHourGrid.addEventListener('click', (event) => {
        const hourButton = event.target.closest('[data-hour]');
        if (!hourButton) return;

        birthHour = hourButton.dataset.hour;
        renderBirthTimeGrid();
        updateBirthTimeValue();
    });

    birthTimeMinuteGrid.addEventListener('click', (event) => {
        const minuteButton = event.target.closest('[data-minute]');
        if (!minuteButton) return;

        birthMinute = minuteButton.dataset.minute;
        renderBirthTimeGrid();
        updateBirthTimeValue();
    });

    bookingDateGrid.addEventListener('click', (event) => {
        const dateButton = event.target.closest('[data-date]');
        if (!dateButton || dateButton.disabled) return;

        syncBookingDateSelection(dateButton.dataset.date);
        bookingTimeInput.value = '';
        bookingTimeDisplay.innerText = 'Choose time slot';
        bookingTimeValues = [];
        renderAppointmentTimeGrid();
        closePicker(bookingDateTrigger.closest('.custom-picker-group'), bookingDatePopover, bookingDateTrigger);

        const durationMinutes = selectedPlan.durationMinutes || 30;
        fetch(`${API_BASE_URL}/appointments/available-slots?date=${dateButton.dataset.date}&durationMinutes=${durationMinutes}`)
            .then(res => res.json())
            .then(data => {
                bookingTimeValues = (data.availableSlots || []).slice();
                renderAppointmentTimeGrid();
            })
            .catch(error => {
                console.error('Error loading time slots:', error);
                bookingTimeValues = [];
                renderAppointmentTimeGrid();
            });
    });

    bookingTimeGrid.addEventListener('click', (event) => {
        const timeButton = event.target.closest('[data-time]');
        if (!timeButton) return;

        syncBookingTimeSelection(timeButton.dataset.time);
        closePicker(bookingTimeTrigger.closest('.custom-picker-group'), bookingTimePopover, bookingTimeTrigger);
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.custom-picker-group')) {
            closeAllBirthPickers();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeAllBirthPickers();
        }
    });

    // Fetch and render packages dynamically
    async function fetchAndRenderPackages() {
        try {
            const pricingGrid = document.getElementById('pricing-grid');
            const res = await fetch(`${API_BASE_URL}/appointments/packages`);
            if (!res.ok) throw new Error("Failed to load packages from database.");
            
            const packages = await res.json();
            pricingGrid.innerHTML = ''; // Clear loading placeholder

            packages.forEach(pack => {
                const isFeatured = pack.slug === 'standard';
                const cardClass = isFeatured ? 'price-card featured' : 'price-card';
                
                let badgeHTML = '';
                if (pack.slug === 'basic') badgeHTML = '<div class="card-badge">Foundation</div>';
                if (pack.slug === 'standard') badgeHTML = '<div class="card-badge popular">Most Popular</div>';
                if (pack.slug === 'premium') badgeHTML = '<div class="card-badge">Ultimate</div>';

                const featuresHTML = pack.features.map(f => `
                    <li>
                        <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        ${f}
                    </li>
                `).join('');

                const card = document.createElement('div');
                card.className = cardClass;
                card.dataset.tier = pack.slug;
                card.dataset.duration = pack.durationMinutes;

                card.innerHTML = `
                    ${badgeHTML}
                    <h2 class="card-title">${pack.title}</h2>
                    <div class="card-price">
                        <span class="currency">₹</span>
                        <span class="amount">${pack.price}</span>
                        <span class="duration">/ session</span>
                    </div>
                    <div class="card-duration">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>${pack.durationMinutes} Minutes Session</span>
                    </div>
                    <p class="card-desc">${pack.description || ''}</p>
                    <ul class="card-features">
                        ${featuresHTML}
                    </ul>
                    <div class="book-btn-section">
                        <button class="book-now-btn btn-primary-card">Book Now</button>
                    </div>
                `;
                
                pricingGrid.appendChild(card);
            });

            // Bind click handlers to newly created package booking buttons
            attachBookButtonListeners();
        } catch (error) {
            console.error("Pricing packages loading error:", error);
            const pricingGrid = document.getElementById('pricing-grid');
            pricingGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ff7675;">
                    <p>Failed to load consultation pricing tiers. Please make sure the database is online.</p>
                </div>
            `;
        }
    }

    // Attach click handlers to Book Now buttons
    function attachBookButtonListeners() {
        const bookNowBtns = document.querySelectorAll('.book-now-btn');
        bookNowBtns.forEach(button => {
            button.addEventListener('click', (e) => {
                const card = e.target.closest('.price-card');
                const tier = card.dataset.tier;
                const durationVal = card.dataset.duration;

                // Extract metadata from pricing card
                let planName = card.querySelector('.card-title').innerText;
                let priceAmount = card.querySelector('.amount').innerText;
                
                // Store selected state
                selectedPlan = {
                    tier: tier,
                    name: planName,
                    price: `₹${priceAmount}`,
                    duration: `${durationVal} Minutes`,
                    durationMinutes: parseInt(durationVal, 10)
                };

                // Populate Form Summary
                summaryTier.innerText = selectedPlan.name;
                summaryDuration.innerText = selectedPlan.duration;
                summaryDateTime.innerText = "Select Date & Time";
                summaryPrice.innerText = selectedPlan.price;

                // Clear previous booking values
                bookingDateInput.value = '';
                bookingTimeInput.value = '';
                bookingTimeDisplay.innerText = 'Select date first';
                bookingTimeTrigger.disabled = true;
                bookingTimeValues = [];
                renderAppointmentTimeGrid();

                // Transition to booking view
                transitionView(landingView, bookingView);
            });
        });
    }

    // Date picker change handler -> Fetches available slots from backend
    bookingDateInput.addEventListener('change', async () => {
        const dateVal = bookingDateInput.value;
        if (!dateVal) return;

        summaryDateTime.innerText = `${formatCalendarDate(dateVal)} • Select a time`;

        try {
            const durationMinutes = selectedPlan.durationMinutes || 30;
            const res = await fetch(`${API_BASE_URL}/appointments/available-slots?date=${dateVal}&durationMinutes=${durationMinutes}`);
            const data = await res.json();

            bookingTimeValues = data.availableSlots || [];
            renderAppointmentTimeGrid();
        } catch (error) {
            console.error("Error loading time slots:", error);
            bookingTimeValues = [];
            renderAppointmentTimeGrid();
        }
    });

    // Update Summary Header on Time Slot change
    bookingTimeInput.addEventListener('input', () => {
        if (bookingDateInput.value && bookingTimeInput.value) {
            summaryDateTime.innerText = `${formatCalendarDate(bookingDateInput.value)} • ${bookingTimeInput.value}`;
        }
    });

    // Helper: Clear invalid styling on user typing
    const inputs = [
        fullNameInput, emailInput, phoneInput, birthDateInput, 
        birthTimeInput, birthPlaceInput, questionInput, 
        bookingDateInput, bookingTimeInput
    ];
    
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const formGroup = input.closest('.form-group');
            if (formGroup && formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid');
            }
        });
    });
    
    function isValidEmail(email) {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(String(email).toLowerCase());
    }

    // Form Submission & Razorpay checkout trigger
    detailsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let isValid = true;
        let firstInvalidElement = null;

        function markInvalid(element) {
            const formGroup = element.closest('.form-group');
            if (formGroup) formGroup.classList.add('invalid');
            isValid = false;
            if (!firstInvalidElement) {
                firstInvalidElement = element;
            }
        }

        // Field Validations
        if (fullNameInput.value.trim().length < 2) markInvalid(fullNameInput);
        if (!isValidEmail(emailInput.value.trim())) markInvalid(emailInput);
        if (phoneInput.value.trim().length < 7) markInvalid(phoneInput);
        if (!birthDateInput.value) markInvalid(birthDateInput);
        if (!birthTimeInput.value) markInvalid(birthTimeInput);
        if (birthPlaceInput.value.trim().length < 3) markInvalid(birthPlaceInput);
        if (questionInput.value.trim().length < 5) markInvalid(questionInput);
        if (!bookingDateInput.value) markInvalid(bookingDateInput);
        if (!bookingTimeInput.value) markInvalid(bookingTimeInput);

        if (!isValid) {
            if (firstInvalidElement) firstInvalidElement.focus();
            return;
        }

        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerText = "Initializing Checkout...";

        try {
            // Step 1: Create Order on backend
            const orderRes = await fetch(`${API_BASE_URL}/payments/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: selectedPlan.tier })
            });

            if (!orderRes.ok) {
                const errData = await orderRes.json();
                throw new Error(errData.error || "Failed to create payment order on server");
            }

            const orderData = await orderRes.json();
            const { orderId, amount, currency, keyId } = orderData;

            // Step 2: Open Razorpay checkout interface
            const options = {
                key: keyId,
                amount: amount,
                currency: currency,
                name: "AuraNumerology",
                description: `${selectedPlan.name} Consultation`,
                order_id: orderId,
                handler: async function (response) {
                    // Triggered upon successful authorization by Razorpay API
                    
                    // Display loading screen during backend signature verification
                    transitionView(bookingView, successView);
                    calculatingOverlay.style.display = 'flex';
                    const text = calculatingOverlay.querySelector('span');
                    const spinner = calculatingOverlay.querySelector('.spinner');
                    text.innerText = "Verifying transaction signature...";

                    try {
                        const verifyRes = await fetch(`${API_BASE_URL}/payments/verify`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                bookingDetails: {
                                    fullName: fullNameInput.value.trim(),
                                    email: emailInput.value.trim(),
                                    phone: phoneInput.value.trim(),
                                    birthDate: birthDateInput.value,
                                    birthTime: birthTimeInput.value,
                                    birthPlace: birthPlaceInput.value.trim(),
                                    question: questionInput.value.trim(),
                                    bookedDate: bookingDateInput.value,
                                    bookedTime: bookingTimeInput.value,
                                    planName: selectedPlan.name,
                                    price: selectedPlan.price
                                }
                            })
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyRes.ok && verifyData.success) {
                            // Populate receipt detail page
                            receiptTier.innerText = selectedPlan.name;
                            receiptTime.innerText = `${formatCalendarDate(bookingDateInput.value)} • ${bookingTimeInput.value}`;
                            receiptName.innerText = fullNameInput.value.trim();

                            text.innerText = "Synchronizing cosmic coefficients...";
                            setTimeout(() => {
                                text.innerText = "Confirming booking emails...";
                                setTimeout(() => {
                                    spinner.style.borderTopColor = 'var(--success)';
                                    text.innerText = "Appointment locked! Confirmation sent.";
                                    setTimeout(() => {
                                        calculatingOverlay.style.opacity = '0';
                                        setTimeout(() => {
                                            calculatingOverlay.style.display = 'none';
                                            calculatingOverlay.style.opacity = '1';
                                        }, 300);
                                    }, 800);
                                }, 1200);
                            }, 1200);

                        } else {
                            alert("Verification Failed: " + (verifyData.error || "Invalid Signature"));
                            transitionView(successView, bookingView);
                        }
                    } catch (err) {
                        console.error("Verification error:", err);
                        alert("Verification Error: Could not connect to API server.");
                        transitionView(successView, bookingView);
                    }
                },
                prefill: {
                    name: fullNameInput.value.trim(),
                    email: emailInput.value.trim(),
                    contact: phoneInput.value.trim()
                },
                theme: {
                    color: "#6c5ce7"
                },
                modal: {
                    ondismiss: function() {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'Pay & Book Consultation <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
                    }
                }
            };

            const rzp = new Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error("Checkout Initialization Error:", error);
            alert("Checkout Error: " + error.message);
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Pay & Book Consultation <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
        }
    });

    // Return to Landing / Pricing View Action
    backBtn.addEventListener('click', () => {
        transitionView(bookingView, landingView);
    });

    // Logo Click Reset Action
    headerLogo.addEventListener('click', () => {
        if (bookingView.style.display === 'block') {
            transitionView(bookingView, landingView);
        } else if (successView.style.display === 'flex') {
            resetForm();
            transitionView(successView, landingView);
        }
    });

    // Reset Form Action
    resetBtn.addEventListener('click', () => {
        resetForm();
        transitionView(successView, landingView);
    });

    function resetForm() {
        detailsForm.reset();
        inputs.forEach(input => {
            const formGroup = input.closest('.form-group');
            if (formGroup) formGroup.classList.remove('invalid');
        });
        document.getElementById('submit-btn').disabled = false;
        document.getElementById('submit-btn').innerHTML = 'Pay & Book Consultation <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
    }

    // Trigger package fetching on startup
    fetchAndRenderPackages();
});

// --- Numerology Loader Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('numerology-loader');
    const loaderNumber = document.getElementById('loader-number');
    const statusText = document.getElementById('loader-status-text');

    if (!loader) return;

    // Cycle through single digits 1-9 to represent numerology calculations
    let currentNum = 1;
    const numberInterval = setInterval(() => {
        currentNum = (currentNum % 9) + 1;
        if (loaderNumber) loaderNumber.innerText = currentNum;
    }, 120);

    // Update status text progressively
    const statuses = [
        "ALIGNING CORE NUMBERS",
        "CALCULATING LIFE PATH",
        "DECODING DESTINY PARAMETERS"
    ];
    let statusIndex = 0;
    const statusInterval = setInterval(() => {
        statusIndex = (statusIndex + 1) % statuses.length;
        if (statusText) statusText.innerText = statuses[statusIndex];
    }, 450);

    // Fade out loader after exactly 1.5 seconds
    setTimeout(() => {
        clearInterval(numberInterval);
        clearInterval(statusInterval);
        
        loader.classList.add('fade-out');
        // Allow fade animation to finish before removing from layout
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }, 1500);
});

