const router = require("express").Router();
const { protectRoute } = require("../middleware/auth.middleware");
const {
  listOrdersForSeller,
  getOrderDetailForSeller,
} = require("../controllers/ordersSeller.controller")

// Danh sách đơn của seller (page/limit)
router.get("/", protectRoute, listOrdersForSeller);

// Chi tiết 1 đơn – chỉ trả các item thuộc seller
router.get("/:id", protectRoute, getOrderDetailForSeller);

module.exports = router;
