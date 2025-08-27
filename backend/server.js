const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./lib/db");
const authRouter = require("./routes/auth.route");
const morgan = require("morgan");
const { app, server } = require("./lib/socket");
const cookieParser = require("cookie-parser");
const productRoutes = require("./routes/product.route");
const cartRoutes = require("./routes/cart.route");
const couponRoutes = require("./routes/coupon.route");
const paymentRoutes = require("./routes/payment.route");
const storeRoutes = require("./routes/store.routes");
const analyticsRoutes = require("./routes/analytics.route.js");
const ordersSellerRoutes = require("./routes/orders.seller.route");
const messageRoutes = require("./routes/message.routes");

dotenv.config();
connectDB();
app.use(morgan("dev"));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' https://js.stripe.com; " +
      "img-src 'self' https://*.stripe.com data:; " +
      "connect-src 'self' https://*.stripe.com https://r.stripe.com; " +
      "frame-src https://js.stripe.com https://hooks.stripe.com;"
  );
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/auth", authRouter);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/orders", ordersSellerRoutes);
app.use("/api/messages", messageRoutes);

const PORT = process.env.PORT || 5000;
app.get("/check-cookie", (req, res) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;
  if (!accessToken) {
    return res.status(401).json({ message: "Access token không tồn tại" });
  }
  res.json({
    accessToken,
    refreshToken,
  });
});
server.listen(PORT, () => {
  console.log(`HTTP + Socket.IO listening on ${PORT}`);
});
