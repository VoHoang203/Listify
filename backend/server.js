const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./lib/db");
const authRouter = require("./routes/auth.route");

const app = express();
dotenv.config();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use("/api/auth", authRouter);
app.listen(PORT, () => {
  console.log(`App run at port ${PORT}`);
  connectDB();
});
