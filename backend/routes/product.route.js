const express = require("express");
const {
  getAllProductsBySeller,
  createProduct,
  deleteProduct,
  getRecommendedProducts,
  getProductsByCategory,
  getAllCategories,
} = require("../controllers/product.controller");
const { sellerRoute, protectRoute } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", protectRoute, sellerRoute, getAllProductsBySeller);
router.get("/category/:category", getProductsByCategory);
router.get("/recommendations", getRecommendedProducts);
router.post("/", protectRoute, sellerRoute, createProduct);
router.delete("/:id", protectRoute, sellerRoute, deleteProduct);
router.get("/category", getAllCategories);
module.exports = router;
