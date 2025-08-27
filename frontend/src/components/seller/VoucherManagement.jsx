import { useMemo, useState } from "react";
import { Ticket, Plus, Calendar, DollarSign, ArrowUpDown, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import { toast } from "react-hot-toast";


const fetchCoupons = async ({ page, limit }) => {
  const res = await api.get("/coupons", { params: { page, limit } });
  // server trả { items, page, limit, total, totalPages }
  return res.data;
};

const createCouponApi = async (payload) => {
  // payload: { code, discountPercentage, expirationDate, isActive? }
  const res = await api.post("/coupons", payload);
  return res.data; // server trả document
};

const toggleCouponActiveApi = async ({ id, isActive }) => {
  const res = await api.patch(`/coupons/${id}/active`, { isActive });
  return res.data;
};
export default function VoucherManagement() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    code: "",
    discountPercentage: "",
    expirationDate: "",
    isActive: true,
  });
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" or "desc"
  const [searchCode, setSearchCode] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["coupons", page, limit],
    queryFn: () => fetchCoupons({ page, limit }),
    keepPreviousData: true,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const filteredAndSorted = useMemo(() => {
    let arr = [...items];

    // filter theo code ở client
    const kw = searchCode.trim().toLowerCase();
    if (kw) {
      arr = arr.filter((v) => (v.code || "").toLowerCase().includes(kw));
    }

    // sort theo createdAt
    arr.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? db - da : da - db;
    });
    return arr;
  }, [items, searchCode, sortOrder]);
  const invalidateCoupons = () =>
    queryClient.invalidateQueries({
      predicate: (q) => q.queryKey?.[0] === "coupons",
    });

  // mutations
  const createMutation = useMutation({
    mutationFn: createCouponApi,
    onSuccess: async () => {
      invalidateCoupons();
      setForm({
        code: "",
        discountPercentage: "",
        expirationDate: "",
        isActive: true,
      });
      toast.success("Tạo voucher thành công!");
    },
    onError: async (e) => {
      const msg =
        e?.response?.data?.message ||
        (e?.response?.status === 409
          ? "Coupon code đã tồn tại"
          : "Tạo voucher thất bại");
      toast.error(msg);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleCouponActiveApi,
    onSuccess: async () => {
      invalidateCoupons();
      toast.success("Cập nhật trạng thái thành công!");
    },
    onError: async (e) => {
      const msg = e?.response?.data?.message || "Cập nhật trạng thái thất bại";
      toast.error(msg);
    },
  });


  const onCreate = () => {
    if (
      !form.code.trim() ||
      form.discountPercentage === "" ||
      !form.expirationDate
    ) {
      return toast.error("Nhập đủ: code / discount% / expirationDate");
    }
    const num = Number(form.discountPercentage);
    if (Number.isNaN(num) || num < 0 || num > 100) {
      return toast.error("discountPercentage phải là số 0 - 100");
    }
    createMutation.mutate({
      code: form.code.trim(),
      discountPercentage: num,
      expirationDate: form.expirationDate, 
      isActive: !!form.isActive,
    });
  };

  const onToggle = (coupon) => {
    toggleMutation.mutate({
      id: coupon._id ?? coupon.id,
      isActive: !coupon.isActive,
    });
  };

  const fmtDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toISOString().split("T")[0];
    } catch {
      return String(d);
    }
  };

  return (
    <div className="space-y-6 text-black">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Ticket className="w-6 h-6" />
        Voucher Management
      </h2>

      {/* Form tạo voucher mới */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Create New Voucher</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Code (ví dụ: WELCOME10)"
            value={form.code}
            onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="number"
              placeholder="Discount %"
              value={form.discountPercentage}
              onChange={(e) =>
                setForm((s) => ({ ...s, discountPercentage: e.target.value }))
              }
              className="w-full pl-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={0}
              max={100}
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={form.expirationDate}
              onChange={(e) =>
                setForm((s) => ({ ...s, expirationDate: e.target.value }))
              }
              className="w-full pl-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          onClick={onCreate}
          disabled={createMutation.isPending}
          className="mt-4 bg-blue-500 disabled:opacity-60 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {createMutation.isPending ? "Creating..." : "Create Voucher"}
        </button>
      </div>
<div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Filter:</span>
          

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search code..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="pl-9 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <span className="text-sm text-gray-600">
            Total (server): {total}
          </span>
          <span className="text-sm text-gray-600">
            Visible (client): {filteredAndSorted.length}
          </span>
        </div>

        <button
          onClick={() => setSortOrder((s) => (s === "desc" ? "asc" : "desc"))}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          <ArrowUpDown className="w-4 h-4" />
          Sort by Created ({sortOrder === "desc" ? "Newest" : "Oldest"})
        </button>
      </div>
      {/* Danh sách voucher */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Voucher List</h3>
            
          </div>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-sm text-gray-600">Loading vouchers...</div>
            ) : isError ? (
              <div className="text-sm text-red-600">
                Failed to load vouchers:{" "}
                {error?.response?.data?.message || error?.message}
              </div>
            ) : filteredAndSorted.length === 0 ? (
              <div className="text-sm text-gray-500">No vouchers found.</div>
            ) : (
              <div className="space-y-4">
                {filteredAndSorted.map((v) => (
                  <div
                    key={v._id ?? v.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-md"
                  >
                    <div>
                      <h4 className="font-medium">{v.code}</h4>
                      <p className="text-sm text-gray-600">
                        Discount: {v.discountPercentage}%
                      </p>
                      <p className="text-sm text-gray-600">
                        Expires: {fmtDate(v.expirationDate)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created: {fmtDate(v.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          v.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {v.isActive ? "Active" : "Disabled"}
                      </span>
                      <button
                        disabled={toggleMutation.isPending}
                        onClick={() => onToggle(v)}
                        className={`px-3 py-1 rounded-md text-sm transition-colors disabled:opacity-60 ${
                          v.isActive
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                      >
                        {toggleMutation.isPending
                          ? "Updating..."
                          : v.isActive
                          ? "Disable"
                          : "Enable"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
