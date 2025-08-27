const express = require("express");
const { protectRoute } = require("../middleware/auth.middleware.js");
const {
  getCoupon,
  validateCoupon,
  listCoupons,
  toggleCouponActive,
  createCoupon,
} = require("../controllers/coupon.controller.js");

const router = express.Router();

router.get("/", protectRoute, listCoupons);
router.post("/validate", validateCoupon);
router.get("/listcoupon", protectRoute, listCoupons);
router.post("/", protectRoute, createCoupon);
router.patch("/:id/active", protectRoute, toggleCouponActive);
module.exports = router;
