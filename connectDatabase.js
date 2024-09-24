import mongoose, { connect } from 'mongoose';
import dotenv from 'dotenv';

// Connect to MongoDB

  const connectDB = async () => {
    try {
        const url = process.env.MONGO_URL;
        await mongoose.connect(url)
        console.log("MongoDB Connected")

    } catch (error) {
       console.error("MongoDB connection failed:", err);
       process.exit(1)
    }
  }

  export default connectDB;