import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, X, User, CheckCircle, XCircle, Search, ArrowUpDown } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../lib/axios"; // axios instance baseURL/withCredentials

/* ---------------- helpers ---------------- */

// Lấy toàn bộ orders của seller từ BE (BE paginate, FE gom về rồi paginate ở client)
async function fetchAllSellerOrders() {
  const limit = 50; // BE đang cap 50
  let page = 1;
  let all = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await api.get("/orders", { params: { page, limit } });
    const items = res.data?.items ?? [];
    const totalPages = res.data?.totalPages ?? 1;
    all = all.concat(items);
    if (page >= totalPages) break;
    page += 1;
  }
  return all;
}

// Map item BE -> shape UI cũ
function mapOrderForUI(o) {
  const oid = String(o._id || "").slice(-6).toUpperCase();
  const created = o.createdAt ? new Date(o.createdAt) : new Date();

  const products = (o.products || []).map((p) => ({
    name: p.name ?? p.product?.name ?? "Product",
    color: p.color ?? "—",
    quantity: Number(p.quantity) || 0,
    price: Number(p.price) || 0,
  }));

  const subtotal = products.reduce((s, it) => s + it.price * it.quantity, 0);

  return {
    id: o._id,
    orderId: `ORD-${oid}`,
    date: created.toISOString().split("T")[0],
    time: created.toTimeString().slice(0, 8),
    customer: o.customerName || o.customer?.name || String(o.buyerId || "N/A"),
    total: Number(o.sellerTotal ?? subtotal),
    status: (o.status || "success").toLowerCase(),
    products,
    subtotal,
    shipping: 0,
  };
}

// Fetch detail (chỉ items thuộc seller – BE đã lọc)
async function fetchOrderDetail(orderId) {
  const res = await api.get(`/orders/${orderId}`);
  // BE trả: { _id, createdAt, customer, products[], sellerTotal, ... }
  return res.data;
}

/* ---------------- component ---------------- */

export default function OrderManagement() {
  // UI states
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null); // giữ nguyên kiểu cũ (chứa object của hàng)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  const [searchCustomer, setSearchCustomer] = useState("");
  const [sortBy, setSortBy] = useState("date"); // "date" | "price"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" | "desc"

  // Query orders (FE gom toàn bộ), client giữ lọc/sort/paginate
  const { data: rawOrders = [], isLoading, isError, error } = useQuery({
    queryKey: ["orders", "seller", "all"],
    queryFn: fetchAllSellerOrders,
    staleTime: 60 * 1000,
    onError: (e) => {
      toast.error(e?.response?.data?.message || "Không lấy được danh sách đơn");
    },
  });

  const orders = useMemo(() => rawOrders.map(mapOrderForUI), [rawOrders]);

  // filter + sort ở client
  const filteredAndSortedOrders = useMemo(() => {
    let arr = orders;

    const kw = searchCustomer.trim().toLowerCase();
    if (kw) {
      arr = arr.filter((o) => (o.customer || "").toLowerCase().includes(kw));
    }

    arr = [...arr].sort((a, b) => {
      let aValue, bValue;
      if (sortBy === "date") {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      } else {
        aValue = a.total;
        bValue = b.total;
      }
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

    return arr;
  }, [orders, searchCustomer, sortBy, sortOrder]);

  // paginate client
  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredAndSortedOrders.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  // GIỮ CŨ: khi bấm detail vẫn set cả object (để không đụng chạm phần còn lại).
  // Modal mới sẽ dùng selectedOrderDetail.id để fetch detail từ BE.
  const handleOrderDetail = (order) => {
    setSelectedOrderDetail(order);
    setShowOrderDetail(true);
  };

  const getStatusBadge = (status) => {
    if (status === "success") {
      return (
        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Success
        </span>
      );
    }
    if (status === "cancelled") {
      return (
        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Cancelled
        </span>
      );
    }
    return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Pending</span>;
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-600">Loading orders…</div>;
  }
  if (isError) {
    return (
      <div className="p-6 text-sm text-red-600">
        Failed to load orders: {error?.response?.data?.message || error?.message || "Unknown error"}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-black">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Orders</h2>
        <p className="text-gray-600">Manage customer orders.</p>
      </div>

      {/* Search + Sort (client) */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by customer..."
                value={searchCustomer}
                onChange={(e) => {
                  setSearchCustomer(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleSort("date")}
                className={`flex items-center gap-1 px-3 py-2 border rounded-md text-sm transition-colors ${
                  sortBy === "date" ? "bg-blue-500 text-black" : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <ArrowUpDown className="w-4 h-4" />
                Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
              </button>

              <button
                onClick={() => handleSort("price")}
                className={`flex items-center gap-1 px-3 py-2 border rounded-md text-sm transition-colors ${
                  sortBy === "price" ? "bg-blue-500 text-black" : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <ArrowUpDown className="w-4 h-4" />
                Price {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Order ID</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-black">{order.orderId}</td>
                <td className="py-3 px-4 text-black">
                  {new Date(order.date).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-black">{order.customer}</td>
                <td className="py-3 px-4 text-black">${order.total}</td>
                <td className="py-3 px-4 text-black">{getStatusBadge(order.status)}</td>
                <td className="py-3 px-4 text-black">
                  <button
                    onClick={() => handleOrderDetail(order)}
                    className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedOrders.length)} of{" "}
              {filteredAndSortedOrders.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx + 1}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-3 py-1 border rounded-md text-sm ${
                    currentPage === idx + 1
                      ? "bg-blue-500 text-black border-blue-500"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal (gọi API detail theo orderId – chỉ items của seller) */}
      {showOrderDetail && selectedOrderDetail && (
        <OrderDetailModal
          orderId={selectedOrderDetail.id}
          fallbackHeader={selectedOrderDetail.orderId} // phòng khi request chậm, vẫn có header
          onClose={() => setShowOrderDetail(false)}
        />
      )}
    </div>
  );
}

/* ---------------- Modal tách riêng: fetch detail ---------------- */

function OrderDetailModal({ orderId, onClose, fallbackHeader }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["order", "seller", orderId],
    queryFn: () => fetchOrderDetail(orderId),
    enabled: !!orderId,
    staleTime: 60 * 1000,
    onError: (e) => {
      toast.error(e?.response?.data?.message || "Không tải được chi tiết đơn");
    },
  });

  const createdAt = data?.createdAt ? new Date(data.createdAt) : null;
  const products = data?.products ?? [];
  const subtotal =
    data?.sellerTotal ??
    products.reduce((s, it) => s + (it.lineTotal ?? (Number(it.price) || 0) * (Number(it.quantity) || 0)), 0);
  const shipping = 0;
  const total = subtotal + shipping;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold">
              Order: {data?._id ? `ORD-${String(data._id).slice(-6).toUpperCase()}` : fallbackHeader}
            </h3>
            <p className="text-sm text-gray-600">
              {createdAt ? createdAt.toTimeString().slice(0, 8) : ""} {createdAt ? createdAt.toLocaleDateString() : ""}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-sm text-gray-600">Loading details…</div>
        ) : isError ? (
          <div className="text-sm text-red-600">
            {error?.response?.data?.message || error?.message || "Load detail failed"}
          </div>
        ) : (
          <>
            {/* Order Items */}
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-3">Order Items</h4>
              <div className="border rounded-lg p-4 space-y-3">
                {products.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image || "/placeholder.svg?height=40&width=40"}
                        alt={p.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                      <div>
                        <h5 className="font-medium">{p.name}</h5>
                        <p className="text-sm text-gray-600">x{p.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${p.price}</p>
                      <p className="text-xs text-gray-500">
                        Line: ${p.lineTotal ?? (Number(p.price) || 0) * (Number(p.quantity) || 0)}
                      </p>
                    </div>
                  </div>
                ))}
                {products.length === 0 && (
                  <div className="text-sm text-gray-500">Không có item nào thuộc seller này trong đơn.</div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-3">Summary</h4>
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>${shipping}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>${total}</span>
                </div>
              </div>
            </div>

            {/* Customer */}
            <div>
              <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer
              </h4>
              <div className="border rounded-lg p-4">
                <p className="font-medium">{data?.customer?.name || String(data?.buyerId || "N/A")}</p>
                <p className="text-gray-600">{data?.customer?.email || "N/A"}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
