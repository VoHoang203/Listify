const mongoose = require("mongoose");
const Coupon = require("../models/coupon.model.js");

const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      sellerId: req.user._id,
      isActive: true,
    });
    res.json(coupon || null);
  } catch (error) {
    console.log("Error in getCoupon controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const validateCoupon = async (req, res) => {
  try {
    let { code } = req.body || {};
    if (!code || typeof code !== "string") {
      return res.status(400).json({ message: "Thiếu hoặc sai code" });
    }

    code = code.trim();

   
    const filter = { code, isActive: true };

    // Tìm coupon hoạt động
    const coupon = await Coupon.findOne(filter).lean();
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // Hết hạn?
    const now = Date.now();
    if (coupon.expirationDate && coupon.expirationDate.getTime() < now) {
      // (tuỳ chọn) đánh dấu inactive ở background flow khác;
      // để controller validate không "tự ý" mutate DB, ta chỉ báo hết hạn:
      return res.status(404).json({ message: "Coupon expired" });
    }

    // OK -> trả kèm sellerId để FE dùng tiếp
    return res.json({
      message: "Coupon is valid",
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
      expirationDate: coupon.expirationDate,
      sellerId: coupon.sellerId, 
    });
  } catch (error) {
    console.error("Error in validateCoupon controller", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountPercentage,
      expirationDate,
      isActive = true,
    } = req.body;

    if (!code || discountPercentage == null || !expirationDate) {
      return res
        .status(400)
        .json({ message: "Thiếu code / discountPercentage / expirationDate" });
    }

    const doc = await Coupon.create({
      code,
      discountPercentage,
      expirationDate,
      isActive,
      sellerId: req.user._id,
    });

    res.status(201).json(doc);
  } catch (error) {
    console.log("Error in createCoupon controller", error.message);
    if (error.code === 11000) {
      return res.status(409).json({ message: "Coupon code đã tồn tại" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const listCoupons = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 10 } = req.query;
    const query = { sellerId: req.user._id };

    if (typeof isActive !== "undefined") {
      query.isActive = isActive === "true";
    }
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Coupon.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Coupon.countDocuments(query),
    ]);

    res.json({
      items,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (error) {
    console.log("Error in listCoupons controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      _id: req.params.id,
      sellerId: req.user._id,
    });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json(coupon);
  } catch (error) {
    console.log("Error in getCouponById controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const { code, discountPercentage, expirationDate, isActive } = req.body;

    const data = {};
    if (typeof code !== "undefined") data.code = code;
    if (typeof discountPercentage !== "undefined")
      data.discountPercentage = discountPercentage;
    if (typeof expirationDate !== "undefined")
      data.expirationDate = expirationDate;
    if (typeof isActive !== "undefined") data.isActive = isActive;

    const updated = await Coupon.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.user._id },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Coupon not found" });
    res.json(updated);
  } catch (error) {
    console.log("Error in updateCoupon controller", error.message);
    if (error.code === 11000) {
      return res.status(409).json({ message: "Coupon code đã tồn tại" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const toggleCouponActive = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive === "undefined") {
      return res.status(400).json({ message: "Thiếu isActive" });
    }

    const updated = await Coupon.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.user._id },
      { $set: { isActive } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Coupon not found" });
    res.json(updated);
  } catch (error) {
    console.log("Error in toggleCouponActive controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const deleted = await Coupon.findOneAndDelete({
      _id: req.params.id,
      sellerId: req.user._id,
    });
    if (!deleted) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.log("Error in deleteCoupon controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getCoupon,
  validateCoupon,
  createCoupon,
  listCoupons,
  getCouponById,
  updateCoupon,
  toggleCouponActive,
  deleteCoupon,
};
