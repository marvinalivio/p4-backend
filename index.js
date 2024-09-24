import express from 'express';
import process from 'node:process';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './connectDatabase.js';
import helmet from 'helmet';
import bcrypt from 'bcrypt';

dotenv.config();

// Connect to database
await connectDB();

const app = express();
const PORT = process.env.PORT || 3000;
app.set('port', PORT);

// Add middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// User Schema with Soft Deletion
const userSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  userPassword: { type: String, required: true },
  deleted: { type: Boolean, default: false },  // Soft deletion field
  profile: [
    {
      photo_url: { type: String },
      about_me: { type: String },
      telNo: { type: String, required: true },
      address: { type: String }
    }
  ],
  education: [
    {
      school_name: { type: String },
      course: { type: String }
    }
  ],
  work_experience: [
    {
      company: { type: String },
      position: { type: String },
      year: { type: String },
      job_description: { type: String }
    }
  ],
  skills: [
    {
      list_skills: { type: String },
      skills_level: { type: Number }
    }
  ],
  portfolio: [
    {
      image_url: { type: String },
      project_title: { type: String },
      project_url: { type: String }
    }
  ]
});

const UserProfile = mongoose.model('users', userSchema); // UserProfile model

// Signup route - create user with hashed password
app.post('/signup', async (req, res) => {
  try {
    const { first_name, last_name, username, userPassword } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !username || !userPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if username exists
    const existingUser = await UserProfile.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userPassword, salt);

    const newUser = new UserProfile({
      first_name,
      last_name,
      username,
      userPassword: hashedPassword
    });

    const insertedUser = await newUser.save();
    res.status(201).json(insertedUser);
  } catch (error) {
    console.error("Error saving user:", error);
    res.status(400).json({ message: 'Error creating user', error });
  }
});

// Update Profile
app.post('/updateProfile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProfile = req.body.profile; // Assuming profile data is sent in 'profile' field

    // Update only the profile field of the user
    const updatedUser = await UserProfile.findByIdAndUpdate(
      { _id:id }, // Find user by ID
      { $set: { profile: updatedProfile } }, // Update the profile field
      { new: true } // Return the updated document
    );

    if (updatedUser) {
      return res.status(200).json(updatedUser);
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update EDUCATION
app.post('/education/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedEducation = req.body.education; // Assuming profile data is sent in 'profile' field

    // Update only the profile field of the user
    const updatedEduc = await UserProfile.findByIdAndUpdate(
      { _id:id }, // Find user by ID
      { $set: { education: updatedEducation } }, // Update the profile field
      { new: true } // Return the updated document
    );

    if (updatedEduc) {
      return res.status(200).json(updatedEduc);
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update Portfolio
app.post('/portfolio/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPortfolio = req.body.portfolio; // Assuming profile data is sent in 'profile' field

    // Update only the profile field of the user
    const updatedPort = await UserProfile.findByIdAndUpdate(
      { _id:id }, // Find user by ID
      { $set: { portfolio: updatedPortfolio } }, // Update the profile field
      { new: true } // Return the updated document
    );

    if (updatedPort) {
      return res.status(200).json(updatedPort);
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: 'Server error', error });
  }
});


// Login route
app.post('/login', async (req, res) => {
  try {
    const { username, userPassword } = req.body;

    // Validate input
    if (!username || !userPassword) {
      return res.status(400).json({ message: 'Both username and password are required' });
    }

    // Check if the user exists
    const user = await UserProfile.findOne({ username });
    if (!user || user.deleted) {
      return res.status(404).json({ message: 'User not found or deleted' });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(userPassword, user.userPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: 'Error during login', error });
  }
});

// Fetch all users (excluding soft deleted ones)
app.get('/', async (req, res) => {
  try {
    const users = await UserProfile.find({ deleted: false }); // Exclude soft deleted users
    res.status(200).json({ allUsers: users });
  } catch (err) {
    console.error("Error querying users:", err);
    res.status(500).send({ message: 'Database query error', error: err });
  }
});

// Soft delete a user (mark as deleted)
app.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Mark the user as deleted
    const deletedUser = await UserProfile.findByIdAndUpdate(id, { deleted: true }, { new: true });
    if (deletedUser) {
      return res.status(200).json({ message: 'User soft deleted', user: deletedUser });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Error during deletion:", error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Listen on the specified port
app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});
