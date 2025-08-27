import { useState, useMemo } from "react";
import { Search, Plus, Edit, Upload, X, Trash2 } from "lucide-react";
import api from "../../lib/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const fileToDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const fetchSellerProducts = async () => {
  const res = await api.get("/products");
  console.log(res);
  return res.data?.products ?? res.data ?? [];
};

const fetchProductsByCategoryId = async (categoryId) => {
  const res = await api.get(`/products/category/${categoryId}`);
  return res.data?.products ?? res.data ?? [];
};

const fetchCategories = async () => {
  const res = await api.get("/products/category");
  return res.data ?? [];
};

const createProductApi = async (payload) => {
  // payload.image phải là string (dataURL hoặc URL) hoặc null
  const body = {
    name: payload.name,
    description: payload.description ?? "",
    price: Number(payload.price),
    image: payload.image ?? null,
    categoryId: payload.categoryId,
  };
  // debug nhẹ:
  // console.log("create body image typeof:", typeof body.image, body.image?.slice?.(0,30));
  const res = await api.post("/products", body);
  return res.data;
};

const deleteProductApi = async (id) => {
  const res = await api.delete(`/products/${id}`);
  return res.data;
};

// BE hiện chưa có route PUT /products/:id; để sẵn cho tương lai
const updateProductApi = async ({ id, payload }) => {
  const body = {
    name: payload.name,
    description: payload.description ?? "",
    price: Number(payload.price),
    image: payload.image ?? null, // <- CHỈ dùng biến truyền vào
    categoryId: payload.categoryId,
    status: payload.status,
  };
  const res = await api.put(`/products/${id}`, body);
  return res.data;
};

/* ------------------- Component ------------------- */
export default function ProductManagement() {
  const queryClient = useQueryClient();

  // UI state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [searchProduct, setSearchProduct] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // image states
  const [selectedImage, setSelectedImage] = useState(null); 
  const [imagePreview, setImagePreview] = useState(null); 

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    categoryId: "",
    categoryName: "",
    image: null,
    status: "Active",
    description: "",
  });

  
  const {
    data: categories = [],
    isLoading: loadingCategories,
    isError: errorCategories,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c._id ?? c.id, name: c.name })),
    [categories]
  );

  const filteredCategories = useMemo(() => {
    const kw = categorySearch.trim().toLowerCase();
    return categoryOptions.filter((c) => c.name.toLowerCase().includes(kw));
  }, [categoryOptions, categorySearch]);

  const {
    data: productsServer = [],
    isLoading: loadingProducts,
    isError: errorProducts,
  } = useQuery({
    queryKey: ["products", selectedCategory],
    queryFn: async () => {
      if (selectedCategory === "All Categories") return fetchSellerProducts();
      const cat = categoryOptions.find((c) => c.name === selectedCategory);
      if (cat?.id) return fetchProductsByCategoryId(cat.id);
      return fetchSellerProducts();
    },
    keepPreviousData: true,
  });

 
  const createMutation = useMutation({
    mutationFn: createProductApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setShowAddProduct(false);
      // reset form + ảnh
      setSelectedImage(null);
      setImagePreview(null);
      setNewProduct({
        name: "",
        price: "",
        categoryId: "",
        categoryName: "",
        image: null,
        status: "Active",
        description: "",
      });
    },
    onError: (e) => {
      console.error("Create product failed:", e?.response?.data || e);
      alert(e?.response?.data?.message ?? "Create product failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProductApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => {
      console.error("Delete product failed:", e?.response?.data || e);
      alert(e?.response?.data?.message ?? "Delete product failed");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateProductApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowEditProduct(false);
      setEditingProduct(null);
      setCategorySearch("");
      // không reset ảnh ở đây vì đang edit
    },
    onError: (e) => {
      console.error("Update product failed:", e?.response?.data || e);
      alert(
        e?.response?.data?.message ??
          "Update failed (Bạn cần thêm endpoint PUT /api/products/:id ở BE)"
      );
    },
  });

 
  const handleCategorySelectInForm = (cat) => {
    setNewProduct((prev) => ({
      ...prev,
      categoryId: cat.id,
      categoryName: cat.name,
    }));
    setCategorySearch(cat.name);
    setShowCategoryDropdown(false);
  };

  const handleAddNewCategoryLocalOnly = () => {
    alert("Tạo category mới từ UI này chưa hỗ trợ. Hãy thêm từ BE.");
  };

  const filteredProducts = useMemo(() => {
    const kw = searchProduct.trim().toLowerCase();
    return (productsServer || []).filter((p) =>
      (p.name ?? "").toLowerCase().includes(kw)
    );
  }, [productsServer, searchProduct]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.categoryId) {
      alert("Vui lòng nhập tên, giá và chọn category");
      return;
    }

    // Lấy base64: ưu tiên imagePreview; nếu chưa có mà có File -> tự chuyển
    let imageData = imagePreview;
    if (!imageData && selectedImage) {
      imageData = await fileToDataURL(selectedImage);
    }

    await createMutation.mutateAsync({
      name: newProduct.name,
      price: newProduct.price,
      categoryId: newProduct.categoryId,
      image: imageData ?? null, // gửi base64 (BE giữ nguyên logic Cloudinary)
      description: newProduct.description ?? "",
    });
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    const cat = categoryOptions.find(
      (c) => (product.categoryId?._id ?? product.categoryId) === c.id
    );
    setNewProduct({
      name: product.name,
      price: String(product.price),
      categoryId: cat?.id ?? product.categoryId ?? "",
      categoryName: cat?.name ?? "",
      image: product.image ?? null,
      status: product.status ?? "Active",
      description: product.description ?? "",
    });
    // hiển thị sẵn ảnh hiện có của sản phẩm (URL Cloudinary)
    setImagePreview(product.image ?? null);
    setSelectedImage(null);
    setCategorySearch(cat?.name ?? "");
    setShowEditProduct(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    if (!newProduct.name || !newProduct.price || !newProduct.categoryId) {
      alert("Vui lòng nhập đủ tên, giá và category");
      return;
    }
    // nếu user chọn ảnh mới -> lấy base64; nếu không -> giữ imagePreview (URL cũ)
    let imageData = imagePreview;
    if (!imageData && selectedImage) {
      imageData = await fileToDataURL(selectedImage);
    }

    updateMutation.mutate({
      id: editingProduct._id ?? editingProduct.id,
      payload: {
        name: newProduct.name,
        price: newProduct.price,
        categoryId: newProduct.categoryId,
        image: imageData ?? null,
        status: newProduct.status,
        description: newProduct.description,
      },
    });
  };

  const handleDeleteProduct = (productId) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(productId);
    }
  };
  console.log(paginatedProducts)

  return (
    <div className="space-y-6 text-black">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Product Management
          </h2>
          <p className="text-gray-600">
            Manage your clothing and footwear products.
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search product..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="w-full pl-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All Categories</option>
              {categoryOptions.map((c) => (
                <option className="text-black" key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              // reset form & ảnh khi mở modal Add
              setNewProduct({
                name: "",
                price: "",
                categoryId: "",
                categoryName: "",
                image: null,
                status: "Active",
                description: "",
              });
              setSelectedImage(null);
              setImagePreview(null);
              setCategorySearch("");
              setShowAddProduct(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loadingProducts ? (
          <div className="p-6 text-sm text-gray-600">Loading products...</div>
        ) : errorProducts ? (
          <div className="p-6 text-sm text-red-600">
            Failed to load products.
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    NAME
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    IMAGE
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    PRICE
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    CATEGORY
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    STATUS
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => (
                  <tr
                    key={product._id ?? product.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">{product.name}</td>
                    <td className="py-3 px-4">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    </td>
                    <td className="py-3 px-4">${product.price}</td>
                    <td className="py-3 px-4">
                      {product.category?.name ??
                        product.categoryName ??
                        product.categoryId?.name ??
                        (selectedCategory === "All Categories"
                          ? product.category
                          : selectedCategory)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        {product.status ?? "Active"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteProduct(product._id ?? product.id)
                          }
                          className="text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(startIndex + itemsPerPage, filteredProducts.length)}{" "}
                  of {filteredProducts.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`px-3 py-1 border rounded-md text-sm ${
                        currentPage === index + 1
                          ? "bg-blue-500 text-white border-blue-500"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Product</h3>
              <button
                onClick={() => setShowAddProduct(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={categorySearch}
                        onChange={(e) => {
                          setCategorySearch(e.target.value);
                          setShowCategoryDropdown(true);
                        }}
                        onFocus={() => setShowCategoryDropdown(true)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {showCategoryDropdown && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 max-h-32 overflow-y-auto z-10 shadow-lg">
                          {filteredCategories.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => handleCategorySelectInForm(cat)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                            >
                              {cat.name}
                            </button>
                          ))}
                          {categorySearch && (
                            <button
                              onClick={handleAddNewCategoryLocalOnly}
                              className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                            >
                              + Create "{categorySearch}"
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleAddNewCategoryLocalOnly}
                      className="bg-pink-500 text-white p-2 rounded-md hover:bg-pink-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={newProduct.status}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, status: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Short description..."
                />
              </div>

              <div className="items-center align-baseline">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-3 text-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mx-auto mb-2 w-20 h-20 object-cover rounded"
                    />
                  ) : (
                    <img
                      src="/placeholder.svg?height=40&width=40"
                      alt="Preview"
                      className="mx-auto mb-2"
                    />
                  )}
                  <label className="text-blue-500 hover:text-blue-700 flex items-center gap-2 mx-auto text-sm cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    Choose File
                  </label>
                  {selectedImage && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="mt-2 text-red-500 hover:text-red-700 text-xs flex items-center gap-1 mx-auto"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  onClick={handleAddProduct}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Adding..." : "Add Product"}
                </button>
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Product</h3>
              <button
                onClick={() => setShowEditProduct(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={categorySearch}
                        onChange={(e) => {
                          setCategorySearch(e.target.value);
                          setShowCategoryDropdown(true);
                        }}
                        onFocus={() => setShowCategoryDropdown(true)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {showCategoryDropdown && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 max-h-32 overflow-y-auto z-10 shadow-lg">
                          {filteredCategories.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => handleCategorySelectInForm(cat)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleAddNewCategoryLocalOnly}
                      className="bg-pink-500 text-white p-2 rounded-md hover:bg-pink-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={newProduct.status}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, status: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-3 text-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mx-auto mb-2 w-20 h-20 object-cover rounded"
                    />
                  ) : (
                    <img
                      src="/placeholder.svg?height=40&width=40"
                      alt="Preview"
                      className="mx-auto mb-2"
                    />
                  )}
                  <label className="text-blue-500 hover:text-blue-700 flex items-center gap-2 mx-auto text-sm cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    Choose File
                  </label>
                  {selectedImage && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="mt-2 text-red-500 hover:text-red-700 text-xs flex items-center gap-1 mx-auto"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  onClick={handleUpdateProduct}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Updating..." : "Update Product"}
                </button>
                <button
                  onClick={() => setShowEditProduct(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
