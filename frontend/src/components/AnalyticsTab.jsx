import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { Users, Package, ShoppingCart, DollarSign } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const AnalyticsTab = () => {
  const [analyticsData, setAnalyticsData] = useState({
    products: 0,
    totalOrders: 0,
    totalUnitsSold: 0,
    totalRevenue: 0,
    buyers: 0,
  });
  const [dailySalesData, setDailySalesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/analytics");
        setAnalyticsData(res.data?.analyticsData?? {});
        setDailySalesData(res.data?.dailySalesData ?? []);
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) return <div>Loading...</div>;

  const fmtCurrency = (n) =>
    typeof n === "number" ? `$${n.toLocaleString()}` : "$0";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <AnalyticsCard
          title="Total Products"
          value={analyticsData.products?.toLocaleString?.() ?? "0"}
          icon={Package}
          color="from-emerald-500 to-green-700"
        />
        <AnalyticsCard
          title="Total Orders"
          value={analyticsData.totalOrders?.toLocaleString?.() ?? "0"}
          icon={ShoppingCart}
          color="from-emerald-500 to-cyan-700"
        />
        <AnalyticsCard
          title="Units Sold"
          value={analyticsData.totalUnitsSold?.toLocaleString?.() ?? "0"}
          icon={Package}
          color="from-emerald-500 to-blue-700"
        />
        <AnalyticsCard
          title="Revenue"
          value={fmtCurrency(analyticsData.totalRevenue || 0)}
          icon={DollarSign}
          color="from-emerald-500 to-lime-700"
        />
        <AnalyticsCard
          title="Unique Buyers"
          value={analyticsData.buyers?.toLocaleString?.() ?? "0"}
          icon={Users}
          color="from-emerald-500 to-teal-700"
        />
      </div>

      {/* Chart: date vs orders/units/revenue */}
      <motion.div
        className="bg-gray-800/60 rounded-lg p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={dailySalesData}>
            <CartesianGrid strokeDasharray="3 3" />
            {/* BE trả 'date' (YYYY-MM-DD) */}
            <XAxis dataKey="date" stroke="#D1D5DB" />
            {/* Trục trái: orders & units; Trục phải: revenue */}
            <YAxis yAxisId="left" stroke="#D1D5DB" />
            <YAxis yAxisId="right" orientation="right" stroke="#D1D5DB" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="orders"
              stroke="#10B981"
              name="Orders"
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="units"
              stroke="#F59E0B"
              name="Units"
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              name="Revenue"
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default AnalyticsTab;

const AnalyticsCard = ({ title, value, icon: Icon, color }) => (
  <motion.div
    className={`relative overflow-hidden bg-gray-800 rounded-lg p-6 shadow-lg`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex justify-between items-center">
      <div className="z-10">
        <p className="text-emerald-300 text-sm mb-1 font-semibold">{title}</p>
        <h3 className="text-white text-3xl font-bold">{value}</h3>
      </div>
    </div>
    {/* nhấn màu nền nhè nhẹ */}
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20`} />
    <div className="absolute -bottom-4 -right-4 text-emerald-800 opacity-40">
      <Icon className="h-32 w-32" />
    </div>
  </motion.div>
);
