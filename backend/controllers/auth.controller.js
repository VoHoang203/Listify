const { User, RefreshToken, Store } = require("../models");
const jwt = require("jsonwebtoken");
const cloudinary = require("../lib/cloudinary");
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "30m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};
const storeRefreshToken = async (userId, refreshToken) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày

  await RefreshToken.deleteMany({ userId });

  const newToken = new RefreshToken({
    userId,
    token: refreshToken,
    expiresAt,
  });

  await newToken.save();
};

//secure =false do dùng http. Deploy dùng https thay doi sau
const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

//login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ message: "User don't exist" });
    }
    if (user && (await user.comparePassword(password))) {
      const { accessToken, refreshToken } = generateTokens(user._id);
      storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);
      return res.json({
				_id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
			});
    } else {
      return res.status(400).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.log("Login BE error: ", error);
    return res.status(400).send({ message: error.message });
  }
};

//sign-up
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).send("Email already exist");
    }
    const newUser = await User.create({ email, password, name });

    //authen token
    const { accessToken, refreshToken } = generateTokens(newUser._id);
    storeRefreshToken(newUser._id, refreshToken);
    setCookies(res, accessToken, refreshToken);
    return res.status(200).send({
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      message: "Success",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(JSON.stringify(error.message));
  }
};

//logout
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      await RefreshToken.deleteMany({ userId: decoded.userId });
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const refreshToken = async (req, res) => {
  try {
    const incoming = req.cookies?.refreshToken;
    if (!incoming) {
      return res.status(401).json({ message: "No refresh token provided" });
    }
    let decoded;
    try {
      decoded = jwt.verify(incoming, process.env.REFRESH_TOKEN_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }
    console.log(decoded)
    const tokenDoc = await RefreshToken.findOne({
      userId: decoded.userId,
      token: incoming,
    });

    if (!tokenDoc) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    if (tokenDoc.expiresAt <= new Date()) {
      await RefreshToken.deleteOne({ _id: tokenDoc._id });
      return res.status(401).json({ message: "Refresh token expired" });
    }

    // cấp lại access token mới (15 phút)
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m" }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 60 * 1000,
    });

    return res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.log("Error in refreshToken controller", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
const registerSeller = async (req, res) => {
  try {
    const { email, storeName, description, bannerDataUrl } = req.body;

    if (!email || !storeName || !description) {
      return res.status(400).json({ message: "email, storeName, description là bắt buộc" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    if (user.role !== "seller") {
      user.role = "seller";
      await user.save();
    }

  
    let bannerImageURL; 
    if (bannerDataUrl) {
      const uploaded = await cloudinary.uploader.upload(bannerDataUrl, {
        folder: "stores/banners",
        transformation: [{ width: 800, height: 800, crop: "limit" }],
      });
      bannerImageURL = uploaded.secure_url; // dùng link mới
    }

    
    let store = await Store.findOne({ sellerId: user._id });

    if (!store) {
      store = await Store.create({
        sellerId: user._id,
        storeName,
        description,
        bannerImageURL, 
      });
    } else {
      store.storeName = storeName;
      store.description = description;
      if (bannerImageURL) store.bannerImageURL = bannerImageURL;
      await store.save();
    }

    const safeUser = {
      _id: user._id, name: user.name, email: user.email, role: user.role,
      createdAt: user.createdAt, updatedAt: user.updatedAt,
    };

    return res.status(200).json({
      message: "Đăng ký người bán thành công",
      user: safeUser,
      store,
    });
  } catch (err) {
    console.error("Error in registerSeller:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
module.exports = { login, register, logout,refreshToken, registerSeller };
