// controllers/message.controller.js (CommonJS)
const User = require("../models/user.model");
const Store = require("../models/store.model");
const Message = require("../models/message.model");
const cloudinary = require("../lib/cloudinary"); 
const { getReceiverSocketId, io } = require("../lib/socket");

// CHỈ SỬA HÀM NÀY
const getUsersForSidebar = async (req, res) => {
  try {
    // lấy role hiện tại
    const me = await User.findById(req.user._id).select("role");
    if (!me) return res.status(401).json({ error: "Unauthorized" });

    // CUSTOMER: trả về toàn bộ SELLER có store (kèm store info)
    if (me.role === "customer") {
      const stores = await Store.find({})
        .populate({ path: "sellerId", select: "name email role" })
        .lean();

      // lọc đúng seller, map ra shape nhẹ để FE dùng như "user"
      const sellers = stores
        .filter((s) => s.sellerId && s.sellerId.role === "seller")
        .map((s) => ({
          _id: s.sellerId._id,          // id user của seller
          name: s.storeName || s.sellerId.name,
          email: s.sellerId.email,
          role: "seller",
          avatar: s.bannerImageURL || null, // ảnh đại diện = banner của store
          storeId: s._id,
          storeName: s.storeName,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return res.status(200).json(sellers);
    }

    // SELLER: chỉ thấy customers đã NHẮN CHO MÌNH (inbound)
    if (me.role === "seller") {
      const inboundSenderIds = await Message.distinct("senderId", {
        receiverId: req.user._id,
      });

      const customers = await User.find({
        _id: { $in: inboundSenderIds },
        role: "customer",
      })
        .select("_id name email role")
        .lean();

      // Có thể thêm avatar user nếu bạn có field
      const result = customers
        .map((u) => ({
          _id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          avatar: null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return res.status(200).json(result);
    }

    return res.status(400).json({ error: "Invalid role" });
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Giữ nguyên 2 hàm này của bạn, chỉ export theo CommonJS
const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const me = await User.findById(myId).select("role");
    const other = await User.findById(userToChatId).select("role");
    if (!me || !other) return res.status(404).json({ error: "User not found" });

    const pairAllowed =
      (me.role === "customer" && other.role === "seller") ||
      (me.role === "seller" && other.role === "customer");
    if (!pairAllowed) {
      return res.status(403).json({ error: "Invalid conversation pair" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Gửi tin nhắn (ảnh base64 optional upload Cloudinary)
 * - Customer -> có thể nhắn cho bất kỳ Seller
 * - Seller   -> CHỈ được nhắn khi đã có ÍT NHẤT 1 tin inbound từ customer đó
 */
const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const me = await User.findById(senderId).select("role");
    const receiver = await User.findById(receiverId).select("role");
    if (!me || !receiver) return res.status(404).json({ error: "User not found" });

    const isCustomerToSeller = me.role === "customer" && receiver.role === "seller";
    const isSellerToCustomer = me.role === "seller" && receiver.role === "customer";

    if (!isCustomerToSeller && !isSellerToCustomer) {
      return res.status(403).json({ error: "Invalid conversation pair" });
    }

    // Seller KHÔNG được nhắn trước
    if (isSellerToCustomer) {
      const hasInbound = await Message.exists({
        senderId: receiverId,      // customer
        receiverId: senderId,      // seller
      });
      if (!hasInbound) {
        return res.status(403).json({
          error: "Customer must start the conversation before seller can reply",
        });
      }
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "messages",
      });
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
module.exports = {
  getUsersForSidebar,
  getMessages,
  sendMessage,
};
