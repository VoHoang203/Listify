import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "../../lib/axios"; // axios instance with baseURL + withCredentials

export default function ProfileManagement() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [bannerPreview, setBannerPreview] = useState(null); // URL hoặc base64 để hiển thị
  const [bannerDataUrl, setBannerDataUrl] = useState(null); // chỉ set khi user chọn ảnh mới

  /* 1) Lấy store khi mở trang */
  const {
    data: store,
    isLoading: isFetchingStore,
    isError,
    error,
  } = useQuery({
    queryKey: ["store", "me"],
    queryFn: async () => {
      const res = await api.get("/stores/me", {
        params: { _t: Date.now() }, // cache-buster tránh 304
        headers: { "Cache-Control": "no-cache" }, // yêu cầu revalidate
        validateStatus: (s) => s === 200 || s === 304,
      });
      if (res.status === 304) return null; // 304 => chưa đổi, coi như null
      return res.data?.store ?? res.data ?? null;
    },
    staleTime: 0,
  });

  // đổ state bất cứ khi nào dữ liệu đổi
  useEffect(() => {
    if (store === undefined) return; // còn đang load
    setStoreName(store?.storeName ?? "");
    setDescription(store?.description ?? "");
    setBannerPreview(store?.bannerImageURL ?? null);
    setBannerDataUrl(null);
  }, [store]);

  useEffect(() => {
    if (isError) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Không tải được thông tin store"
      );
    }
  }, [isError, error]);

  /* 2) Submit đổi cả tên/description và ảnh (nếu có) trong 1 PATCH */
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.patch("/stores/me", payload);
      return res.data?.store ?? res.data;
    },
    onSuccess: (updated) => {
      setStoreName(updated?.storeName ?? storeName);
      setDescription(updated?.description ?? description);
      setBannerPreview(updated?.bannerImageURL ?? bannerPreview);
      setBannerDataUrl(null);
      queryClient.invalidateQueries({ queryKey: ["store", "me"] });
      toast.success("Cập nhật store thành công!");
    },
    onError: (e) => {
      toast.error(e?.response?.data?.message || "Cập nhật thất bại");
    },
  });

  /* 3) GIỮ cách chọn ảnh của bạn: chỉ set state, không gọi API ở đây */
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64Image = reader.result;
      setBannerPreview(base64Image); // hiển thị ngay
      setBannerDataUrl(base64Image); // gửi kèm khi Submit
      e.target.value = ""; // cho phép chọn lại cùng file lần sau
    };
  };

  const handleSubmit = () => {
    if (!storeName.trim()) {
      toast.error("Store name không được trống");
      return;
    }
    const payload = {
      storeName: storeName.trim(),
      description,
      ...(bannerDataUrl ? { bannerDataUrl } : {}), // chỉ gửi nếu user vừa chọn ảnh
    };
    updateMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-gray-200 p-6 text-black">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-500 mb-2">
            Store Profile
          </h1>
          <p className="text-gray-600">Quản lý thông tin cửa hàng</p>
        </div>

        {/* Banner */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <img
              src={bannerPreview || "/placeholder.svg"}
              alt="Store banner"
              className="w-72 h-36 object-cover rounded-lg border-4 border-purple-400 bg-white"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isFetchingStore || updateMutation.isPending}
              className="absolute bottom-2 right-2 bg-blue-500 rounded-full p-2 hover:bg-blue-600 transition-colors disabled:opacity-60"
              title="Chọn ảnh banner"
            >
              <Camera className="w-5 h-5 text-gray-900" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
          <p className="text-gray-500 mt-3">
            Chọn banner mới nếu muốn thay ảnh
          </p>
        </div>

        {/* Form: Store name + Description */}
        <div className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-gray-700 mb-2">Store Name</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              placeholder="Nhập tên cửa hàng..."
              disabled={isFetchingStore || updateMutation.isPending}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              placeholder="Giới thiệu ngắn về cửa hàng..."
              disabled={isFetchingStore || updateMutation.isPending}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isFetchingStore || updateMutation.isPending}
              className="px-5 py-2 rounded-md bg-blue-500 text-gray-900 font-medium hover:bg-blue-600 disabled:opacity-60"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
