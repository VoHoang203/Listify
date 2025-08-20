const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./lib/db");
const authRouter = require("./routes/auth.route");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const app = express();
dotenv.config();
connectDB();
app.use(morgan("dev"));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());

app.use(express.json());
app.use("/api/auth", authRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`App run at port ${PORT}`);
});
