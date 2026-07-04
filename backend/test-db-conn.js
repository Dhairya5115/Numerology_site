require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error('MONGO_URI is not set in environment. Please set it in backend/.env or environment variables.');
  process.exit(1);
}

console.log('Attempting MongoDB connection to:', mongoURI.replace(/:[^:@]+@/, ':*****@'));

mongoose.connect(mongoURI, { connectTimeoutMS: 10000 })
  .then(conn => {
    console.log('Connected to MongoDB:', conn.connection.host);
    return mongoose.disconnect();
  })
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Connection error (full):', err);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  });
