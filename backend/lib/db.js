const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME,
    });
    console.log(`MongoDB connected successfully: ${process.env.DB_NAME}`);
  } catch (error) {
    console.error("MongoDB connection failed: ", error);
    process.exit(1); // Dừng server nếu không thể kết nối
  }
};

module.exports = connectDB;
