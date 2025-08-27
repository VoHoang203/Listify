const express = require("express");
const { login, register, logout,refreshToken, registerSeller } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/login", login);
router.post("/signup", register);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.post("/register-seller", registerSeller);

module.exports = router;
