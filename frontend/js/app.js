document.addEventListener('DOMContentLoaded', () => {
    // API Server Config
    const API_BASE_URL = 'http://localhost:5000/api';

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
    
    // Booking Date & Time inputs
    const bookingDateInput = document.getElementById('booking-date');
    const bookingTimeSelect = document.getElementById('booking-time');

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
    bookingDateInput.min = today;

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
                bookingTimeSelect.value = '';
                bookingTimeSelect.disabled = true;
                bookingTimeSelect.innerHTML = '<option value="">Select Date First</option>';

                // Transition to booking view
                transitionView(landingView, bookingView);
            });
        });
    }

    // Date picker change handler -> Fetches available slots from backend
    bookingDateInput.addEventListener('change', async () => {
        const dateVal = bookingDateInput.value;
        if (!dateVal) return;

        bookingTimeSelect.disabled = true;
        bookingTimeSelect.innerHTML = '<option value="">Loading slots...</option>';
        summaryDateTime.innerText = `${dateVal} (Select Time)`;

        try {
            const durationMinutes = selectedPlan.durationMinutes || 30;
            const res = await fetch(`${API_BASE_URL}/appointments/available-slots?date=${dateVal}&durationMinutes=${durationMinutes}`);
            const data = await res.json();

            if (data.availableSlots && data.availableSlots.length > 0) {
                bookingTimeSelect.innerHTML = '<option value="">Choose Time Slot</option>';
                data.availableSlots.forEach(slot => {
                    const opt = document.createElement('option');
                    opt.value = slot;
                    opt.innerText = slot;
                    bookingTimeSelect.appendChild(opt);
                });
                bookingTimeSelect.disabled = false;
            } else {
                bookingTimeSelect.innerHTML = '<option value="">No slots available for this day</option>';
                bookingTimeSelect.disabled = true;
            }
        } catch (error) {
            console.error("Error loading time slots:", error);
            bookingTimeSelect.innerHTML = '<option value="">Failed to load slots</option>';
            bookingTimeSelect.disabled = true;
        }
    });

    // Update Summary Header on Time Slot change
    bookingTimeSelect.addEventListener('change', () => {
        if (bookingDateInput.value && bookingTimeSelect.value) {
            summaryDateTime.innerText = `${bookingDateInput.value} at ${bookingTimeSelect.value}`;
        }
    });

    // Helper: Clear invalid styling on user typing
    const inputs = [
        fullNameInput, emailInput, phoneInput, birthDateInput, 
        birthTimeInput, birthPlaceInput, questionInput, 
        bookingDateInput, bookingTimeSelect
    ];
    
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const formGroup = input.closest('.form-group');
            if (formGroup && formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid');
            }
        });
    });
    
    // For select element specifically
    bookingTimeSelect.addEventListener('change', () => {
        const formGroup = bookingTimeSelect.closest('.form-group');
        if (formGroup && formGroup.classList.contains('invalid')) {
            formGroup.classList.remove('invalid');
        }
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
        if (!bookingTimeSelect.value) markInvalid(bookingTimeSelect);

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
                                    bookedTime: bookingTimeSelect.value,
                                    planName: selectedPlan.name,
                                    price: selectedPlan.price
                                }
                            })
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyRes.ok && verifyData.success) {
                            // Populate receipt detail page
                            receiptTier.innerText = selectedPlan.name;
                            receiptTime.innerText = `${bookingDateInput.value} at ${bookingTimeSelect.value}`;
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
