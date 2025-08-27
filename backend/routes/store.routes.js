const express = require("express");
const router = express.Router();
const {  protectRoute } = require("../middleware/auth.middleware");

const { getMyStore, updateMyStore } = require("../controllers/store.controller");


router.get("/me", protectRoute, getMyStore);
router.patch("/me", protectRoute, updateMyStore);

module.exports = router;