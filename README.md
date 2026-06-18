# AuraNumerology / Numerology Site

AuraNumerology is a full-stack appointment booking system for numerology consultations. It lets users choose a consultation package, pick an available date and time slot, pay securely through Razorpay, and receive confirmation emails after the booking is verified.

## What The Project Does

The application is split into two parts:

- `backend/` handles MongoDB, Razorpay, email notifications, slot availability, and booking verification.
- `frontend/` provides the landing page, package list, booking form, Razorpay checkout trigger, and success screen.

The flow is intentionally simple:

1. The frontend loads active consultation packages from the backend.
2. The user selects a package and date.
3. The backend calculates available time slots for that date and session length.
4. The user fills in personal and birth details and starts Razorpay checkout.
5. Razorpay returns payment details to the frontend.
6. The frontend sends those details to the backend for signature verification.
7. The backend confirms the booking, stores the payment, and sends emails to the client and admin.
8. A webhook endpoint is also available so Razorpay events can be processed independently.

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- Razorpay Orders + Checkout
- Nodemailer with Gmail SMTP
- Vanilla HTML, CSS, and JavaScript on the frontend

## Project Structure

```text
backend/
	app.js                     Express entry point
	config/                    Database, Razorpay, and mail setup
	controllers/               Booking, payment, and webhook logic
	middleware/                Razorpay webhook signature verification
	models/                    MongoDB schemas
	routes/                    API route definitions
	services/                  Razorpay helper functions
	utils/                     Time-slot and overlap helpers
frontend/
	html/index.html            Main UI
	js/app.js                  Booking flow, validation, checkout logic
	css/style.css              Styling
```

## How It Works

### 1. App startup

The backend starts from [backend/app.js](backend/app.js). It loads environment variables, connects to MongoDB, enables CORS, captures the raw request body for webhook verification, and mounts these routes:

- `/api/appointments`
- `/api/payments`
- `/api/webhooks`

When the database connection succeeds, default consultation packages are seeded if the collection is empty.

### 2. Package loading

The frontend calls `GET /api/appointments/packages` to load active plans from MongoDB.

The seeded plans are created in [backend/config/db.js](backend/config/db.js):

- `Destiny Core` - 30 minutes - ₹500
- `Soul Path Alignment` - 45 minutes - ₹750
- `Cosmic Oracle` - 60 minutes - ₹1000

### 3. Slot calculation

When a user picks a booking date, the frontend calls `GET /api/appointments/available-slots?date=YYYY-MM-DD&durationMinutes=X`.

The backend:

- reads all non-cancelled appointments for that date
- uses business hours from 9:00 AM to 7:00 PM
- generates back-to-back candidate slots based on the selected package duration
- removes any slot that overlaps with an already booked appointment

### 4. Checkout creation

When the form is submitted, the frontend calls `POST /api/payments/order` with the selected package tier.

The backend:

- finds the matching active package by slug
- creates a Razorpay order in paise
- returns `orderId`, `amount`, `currency`, and `keyId` to the frontend

### 5. Payment verification and booking

After Razorpay checkout succeeds, the frontend calls `POST /api/payments/verify` with:

- Razorpay payment ID
- Razorpay order ID
- Razorpay signature
- the booking details collected from the form

The backend then:

- verifies the Razorpay signature
- checks again that the selected slot is still free
- creates a `User` document if needed
- creates or updates the `Appointment`
- creates the `Payment` record
- sends confirmation emails to the client and admin

### 6. Webhook processing

The `/api/webhooks` route is protected by a signature-verification middleware in [backend/middleware/verifyWebhook.js](backend/middleware/verifyWebhook.js). It validates the `x-razorpay-signature` header against the raw request body.

The webhook controller then:

- prevents duplicate processing using the webhook event ID
- links the payment to an appointment
- marks the booking as paid/confirmed when a `payment.captured` or `order.paid` event arrives
- stores a `RazorpayWebhook` record for auditability
- sends emails again if the booking was finalized through the webhook path

## Frontend Flow

The UI in [frontend/html/index.html](frontend/html/index.html) has three main views:

- landing/pricing view
- booking form view
- success view

The frontend script in [frontend/js/app.js](frontend/js/app.js):

- fetches packages on page load
- opens the booking form when a plan is selected
- fetches available time slots after the user picks a date
- validates the user form before payment
- launches Razorpay Checkout
- shows the confirmation screen after successful verification

## API Endpoints

### Appointment routes

- `GET /api/appointments/packages`
	- Returns all active consultation packages.

- `GET /api/appointments/available-slots?date=YYYY-MM-DD&durationMinutes=X`
	- Returns free time slots for the selected date and session length.

### Payment routes

- `POST /api/payments/order`
	- Creates a Razorpay order for the selected package.

- `POST /api/payments/verify`
	- Verifies the payment signature and saves the booking.

### Webhook route

- `POST /api/webhooks`
	- Accepts Razorpay webhook events after signature verification.

## Database Models

- `User`
	- Stores name, email, phone, birth date, birth time, and birth place.

- `AppointmentPackage`
	- Stores package title, slug, duration, price, description, and features.

- `Appointment`
	- Stores the booking, chosen package, payment status, appointment status, slot, and Razorpay order ID.

- `Payment`
	- Stores payment IDs, order ID, signature, amount, and payment status.

- `RazorpayWebhook`
	- Stores webhook event history and processing state.

## Environment Variables

Create a `.env` file in `backend/` using [backend/example.env](backend/example.env) as the template.

Required values:

- `PORT` - server port, default `5000`
- `MONGO_URI` - MongoDB connection string
- `RAZORPAY_KEY_ID` - Razorpay public key
- `RAZORPAY_KEY_SECRET` - Razorpay secret key
- `RAZORPAY_WEBHOOK_SECRET` - webhook signing secret used by Razorpay
- `EMAIL_USER` - Gmail sender address
- `EMAIL_PASS` - Gmail app password
- `ADMIN_EMAIL` - admin inbox for booking alerts

## Local Setup

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

The backend runs on `http://localhost:5000` by default.

### 2. Frontend

Serve the `frontend/` folder with a local static server or VS Code Live Server. The frontend script currently points to `http://localhost:5000/api`.

### 3. Open The App

Open [frontend/html/index.html](frontend/html/index.html) through your static server and make sure the backend is running first.

## Notes

- The booking slot logic uses fixed business hours from 9:00 AM to 7:00 PM.
- Cancelled appointments are ignored when calculating availability.
- Email delivery depends on valid Gmail app-password credentials.
- Razorpay webhook processing is optional but recommended for extra confirmation reliability.
- The frontend validation checks basic fields only; the backend still re-verifies payment and slot availability before saving the booking.

## Quick Summary

This project is a numerology consultation booking system with package selection, slot management, Razorpay payments, email confirmations, and webhook-based payment tracking.