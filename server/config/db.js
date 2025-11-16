// ============================================
// config/database.js
// ============================================
// This file handles connecting to MongoDB

import mongoose from 'mongoose';
import { MONGODB_URI } from './env.js';


 
const connectDb = async () => {
  try {
    // Get MongoDB connection string from environment variables
    // We store sensitive info like database URLs in .env file
    const mongoURI = process.env.MONGODB_URI;

    // Check if MongoDB URI is provided
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Connect to MongoDB
    // These options help prevent deprecation warnings and ensure stable connection
    await mongoose.connect(MONGODB_URI, {
      
      useNewUrlParser: true,
      
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // Exit the application if database connection fails
    // There's no point running a chat app without a database
    process.exit(1);
  }
};

/**
 * Handle MongoDB connection events
 * These help us know what's happening with our database connection
 */
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

/**
 * Graceful shutdown
 * When the Node.js process is terminated, close the database connection properly
 * This prevents data corruption
 */
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});


 

export default connectDb;