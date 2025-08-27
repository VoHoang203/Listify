// controllers/analytics.controller.js
const { Order, Product } = require("../models");
const mongoose = require("mongoose");

const oid = (v) => new mongoose.Types.ObjectId(String(v));

function getDatesInRange(startDate, endDate) {
  const dates = [];
  const d = new Date(startDate);
  d.setHours(0, 0, 0, 0);
  const to = new Date(endDate);
  to.setHours(23, 59, 59, 999);
  while (d <= to) {
    dates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}
const getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = oid(req.user._id);

    // khoảng mặc định: 30 ngày qua (có thể truyền ?from=YYYY-MM-DD&to=YYYY-MM-DD)
    const from = req.query.from
      ? new Date(req.query.from)
      : new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(Date.now()+24 * 60 * 60 * 1000) : new Date();

    const [totalProducts, head] = await Promise.all([
      Product.countDocuments({ sellerId }),
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $unwind: "$products" },
        { $match: { "products.sellerId": sellerId } },
        // Gộp theo từng đơn để lấy doanh thu/units của seller trong đơn đó
        {
          $group: {
            _id: "$_id",
            buyerId: { $first: "$buyerId" },
            orderRevenue: {
              $sum: { $multiply: ["$products.price", "$products.quantity"] },
            },
            units: { $sum: "$products.quantity" },
          },
        },
        // Tổng hợp cuối
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$orderRevenue" },
            totalUnitsSold: { $sum: "$units" },
            buyersSet: { $addToSet: "$buyerId" },
          },
        },
        {
          $project: {
            _id: 0,
            totalOrders: 1,
            totalRevenue: 1,
            totalUnitsSold: 1,
            buyers: { $size: "$buyersSet" },
          },
        },
      ]),
    ]);

    const analyticsData = {
      products: totalProducts,
      totalOrders: head[0]?.totalOrders || 0,
      totalUnitsSold: head[0]?.totalUnitsSold || 0,
      totalRevenue: head[0]?.totalRevenue || 0,
      buyers: head[0]?.buyers || 0,
    };

    // Dòng theo ngày
    const dailyAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      { $unwind: "$products" },
      { $match: { "products.sellerId": sellerId } },
      {
        $group: {
          _id: {
            orderId: "$_id",
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          revenuePerOrder: {
            $sum: { $multiply: ["$products.price", "$products.quantity"] },
          },
          unitsPerOrder: { $sum: "$products.quantity" },
        },
      },
      {
        $group: {
          _id: "$_id.day",
          orders: { $sum: 1 },
          revenue: { $sum: "$revenuePerOrder" },
          units: { $sum: "$unitsPerOrder" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // fill ngày trống
    const dates = getDatesInRange(from, to);
    const dailySalesData = dates.map((d) => {
      const row = dailyAgg.find((x) => x._id === d);
      return {
        date: d,
        orders: row?.orders || 0,
        units: row?.units || 0,
        revenue: row?.revenue || 0,
      };
    });

    return res.json({ analyticsData, dailySalesData });
  } catch (e) {
    console.error("getSellerAnalytics error:", e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};
module.exports = { getSellerAnalytics };
