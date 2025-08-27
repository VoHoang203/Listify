const mongoose = require("mongoose");
const { Order } = require("../models");

const toId = (v) => new mongoose.Types.ObjectId(String(v));

/**
 * GET /api/orders/seller?page=&limit=
 * Trả { items, page, limit, total, totalPages }
 * Mỗi item đã kèm products[] chỉ gồm hàng của seller + sellerTotal, sellerUnits
 */
const listOrdersForSeller = async (req, res) => {
  try {
    const sellerId = toId(req.user._id);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [total, orders] = await Promise.all([
      Order.countDocuments({ "products.sellerId": sellerId }),
      Order.find({ "products.sellerId": sellerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          // lấy thông tin sản phẩm hiển thị
          path: "products.product",
          select: "name image price",
        })
        .populate({
          // nếu muốn hiện tên/email khách
          path: "buyerId",
          select: "fullName name email",
        })
        .lean(),
    ]);

    const items = orders.map((o) => {
      // Lọc chỉ items thuộc seller
      const sellerProducts = (o.products || [])
        .filter((p) => String(p.sellerId) === String(sellerId))
        .map((p) => ({
          productId: p.product?._id ?? p.product, // đã populate nên thường là object
          name: p.product?.name,
          image: p.product?.image,
          price: p.price, // giá được chốt lúc mua (lưu trong order)
          quantity: p.quantity,
          lineTotal: p.price * p.quantity,
        }));

      const sellerTotal = sellerProducts.reduce((s, it) => s + it.lineTotal, 0);
      const sellerUnits = sellerProducts.reduce((s, it) => s + it.quantity, 0);

      return {
        _id: o._id,
        createdAt: o.createdAt,
        buyerId: o.buyerId?._id || o.buyerId,
        customerName: o.buyerId?.fullName || o.buyerId?.name || undefined,
        products: sellerProducts,
        sellerTotal,
        sellerUnits,
        itemCount: sellerProducts.length,
        stripeSessionId: o.stripeSessionId,
        status: o.status || "Success",
      };
    });

    return res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (e) {
    console.error("listOrdersForSeller error:", e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

/**
 * GET /api/orders/seller/:id
 * Trả chi tiết đơn – chỉ items của seller
 */
const getOrderDetailForSeller = async (req, res) => {
  try {
    const sellerId = toId(req.user._id);
    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const o = await Order.findById(orderId)
      .populate({ path: "products.product", select: "name image price" })
      .populate({ path: "buyerId", select: "fullName name email" })
      .lean();

    if (!o) return res.status(404).json({ message: "Order not found" });

    // Đảm bảo order này có hàng của seller
    const hasSellerItem = (o.products || []).some(
      (p) => String(p.sellerId) === String(sellerId)
    );
    if (!hasSellerItem) {
      return res
        .status(404)
        .json({ message: "Order not found for this seller" });
    }

    const products = (o.products || [])
      .filter((p) => String(p.sellerId) === String(sellerId))
      .map((p) => ({
        productId: p.product?._id ?? p.product,
        name: p.product?.name,
        image: p.product?.image,
        price: p.price,
        quantity: p.quantity,
        lineTotal: p.price * p.quantity,
      }));

    const sellerTotal = products.reduce((s, it) => s + it.lineTotal, 0);
    const sellerUnits = products.reduce((s, it) => s + it.quantity, 0);

    return res.json({
      _id: o._id,
      createdAt: o.createdAt,
      buyerId: o.buyerId?._id || o.buyerId,
      customer: {
        name: o.buyerId?.fullName || o.buyerId?.name,
        email: o.buyerId?.email,
      },
      products, // CHỈ items của seller
      sellerTotal,
      sellerUnits,
      stripeSessionId: o.stripeSessionId,
      status: o.status || "Success",
    });
  } catch (e) {
    console.error("getOrderDetailForSeller error:", e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};
module.exports = {
  listOrdersForSeller,
  getOrderDetailForSeller,
};