const { User } = require("../models/user.model");
const jwt = require("jsonwebtoken");

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};
const login = (req, res) => {
  console.log("Login");
};
const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", 
    maxAge: 60 * 60 * 1000, 
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", 
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).send("Email already exist");
    }
    const newUser = await User.create({ email, password, name });
    return res.status(200).send({ user: newUser, message: "Success" });
  } catch (error) {
    console.log(error);
    return res.status(500).send(JSON.stringify(error.message));
  }
};
const logout = (req, res) => {
  console.log("Forgot");
};

module.exports = { login, register, logout };
