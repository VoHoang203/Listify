const express = require("express");
const {
  login,
  register,
  forgotPassword,
} = require("../controllers/auth.controller");

const router = express.Router();

router.get("/login", login);
router.get("/register", register);
router.get("/forgot", forgotPassword);

module.exports = router;
