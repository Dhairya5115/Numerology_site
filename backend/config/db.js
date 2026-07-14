const mongoose = require('mongoose');
const AppointmentPackage = require('../models/AppointmentPackage');

/**
 * Seeds the database with default packages if empty
 */
const seedPackages = async () => {
    try {
        const count = await AppointmentPackage.countDocuments();
        if (count === 0) {
            console.log('No appointment packages found in the database. Seeding defaults...');
            
            const defaultPackages = [
                {
                    title: 'Destiny Core',
                    slug: 'basic',
                    durationMinutes: 30,
                    price: 500,
                    description: 'Quick intro reading to understand your core numbers.',
                    features: [
                        'Life Path & Destiny analysis',
                        '30-Minute Live Session'
                    ],
                    isActive: true
                },
                {
                    title: 'Soul Path Alignment',
                    slug: 'standard',
                    durationMinutes: 45,
                    price: 750,
                    description: 'In-depth reading mapping out career and relationship alignments.',
                    features: [
                        'Core Profile & Career Focus',
                        '45-Minute Live Session + 1 Question'
                    ],
                    isActive: true
                },
                {
                    title: 'Cosmic Oracle',
                    slug: 'premium',
                    durationMinutes: 60,
                    price: 1000,
                    description: 'Complete lifecycle mapping with full chart PDF & guidance.',
                    features: [
                        'Full Chart Analysis + PDF Report',
                        '60-Minute Live Session + Q&A'
                    ],
                    isActive: true
                }
            ];

            await AppointmentPackage.insertMany(defaultPackages);
            console.log('Seeded 3 default appointment packages successfully!');
        } else {
            console.log(`Verified ${count} existing appointment package(s) in the database.`);
        }
    } catch (error) {
        console.error('Error seeding appointment packages:', error.message);
    }
};

/**
 * Connect to MongoDB Database
 */
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/numerologyDB';
        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 30000
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Seed default database packages
        await seedPackages();
    } catch (error) {
        console.error(`MongoDB Connection Failed: ${error.message}`);
        console.log('Proceeding with startup... Ensure MongoDB service is running for features to work.');
    }
};

module.exports = connectDB;
