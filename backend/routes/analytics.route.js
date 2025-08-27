const router = require("express").Router();
const { getSellerAnalytics } = require("../controllers/analytics.controller");
const { protectRoute } = require("../middleware/auth.middleware");

router.get("/", protectRoute, getSellerAnalytics);

module.exports = router;
