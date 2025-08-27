const Store = require("../models/store.model");
const cloudinary = require("../lib/cloudinary");

// GET /api/stores/me
const getMyStore = async (req, res) => {
  try {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
    const store = await Store.findOne({ sellerId: req.user._id });
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json({ store });
  } catch (e) {
    console.error("getMyStore error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/stores/me
// body: { storeName?, description?, bannerDataUrl? }
const updateMyStore = async (req, res) => {
  try {
    const { storeName, description, bannerDataUrl } = req.body;

    const update = {};
    if (typeof storeName === "string") update.storeName = storeName.trim();
    if (typeof description === "string") update.description = description;

    if (bannerDataUrl) {
      const uploaded = await cloudinary.uploader.upload(bannerDataUrl, {
        folder: "stores/banner",
        transformation: [{ width: 800, height: 400, crop: "limit" }],
      });
      update.bannerImageURL = uploaded.secure_url;
    }

    // Nếu store chưa tồn tại, có thể upsert (tuỳ yêu cầu)
    const store = await Store.findOneAndUpdate(
      { sellerId: req.user._id },
      { $set: update },
      { new: true, upsert: false } // đổi thành true nếu muốn tự tạo
    );

    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json({ store });
  } catch (e) {
    console.error("updateMyStore error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getMyStore, updateMyStore };
