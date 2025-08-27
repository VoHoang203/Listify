const { Product, Category } = require("../models");
const cloudinary = require("../lib/cloudinary");
const mongoose = require("mongoose");

const getAllProductsBySeller = async (req, res) => {
  try {
    const sellerId = req.user?._id;
    console.log(sellerId);
    const products = await Product.find({ sellerId }).populate(
      "categoryId",
      "name"
    );
    const data = products?.map((p) => ({
      _id: p._id,
      name:p.name,
      description: p.description,
      category: p.categoryId.name,
      price: p.price,
      image: p.image,
    }));
    res.json(data);
  } catch (error) {
    console.log("Error in getAllProductsBySeller controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Tạo sản phẩm: dùng categoryId (ObjectId) + sellerId từ token
const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, categoryId } = req.body;

    if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
      return res.status(400).json({ message: "categoryId không hợp lệ" });
    }

    // kiểm tra Category tồn tại
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category không tồn tại" });
    }

    // lấy sellerId từ auth (middleware protectRoute + sellerRoute đã set req.user)
    const sellerId = req.user?._id;
    if (!sellerId) {
      return res.status(401).json({ message: "Chưa xác thực người bán" });
    }

    let cloudinaryResponse = null;
    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url || "",
      categoryId,
      sellerId,
    });

    res.status(201).json(product);
  } catch (error) {
    console.log("Error in createProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Xoá sản phẩm: chỉ cho phép seller sở hữu xoá
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // kiểm tra quyền: seller chỉ xoá sản phẩm của mình
    if (
      req.user?.role === "seller" &&
      product.sellerId.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xoá sản phẩm này" });
    }

    // Xoá ảnh trên Cloudinary nếu có
    if (product.image) {
      try {
        const parts = product.image.split("/");
        const filename = parts.pop(); // abc123.jpg
        const folder = parts.pop(); // products
        const publicId = `${folder}/${filename.split(".")[0]}`; // products/abc123
        await cloudinary.uploader.destroy(publicId);
        console.log("deleted image from cloudinary");
      } catch (error) {
        console.log("error deleting image from cloudinary", error);
      }
    }

    await Product.findByIdAndDelete(product._id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log("Error in deleteProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Gợi ý sản phẩm ngẫu nhiên (không phụ thuộc category cũ)
const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $sample: { size: 4 } },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
          categoryId: 1,
          sellerId: 1,
        },
      },
    ]);
    res.json(products);
  } catch (error) {
    console.log("Error in getRecommendedProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Lấy sản phẩm theo Category:
 * - Ưu tiên nhận :categoryId trên params (ObjectId)
 * - Nếu không phải ObjectId, coi như là tên category -> lookup Category theo name (case-insensitive)
 *   và tìm theo _id của Category
 */
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params; // có thể là categoryId hoặc name

    let categoryDoc = null;

    if (mongoose.isValidObjectId(category)) {
      categoryDoc = await Category.findById(category);
      if (!categoryDoc)
        return res.status(404).json({ message: "Category không tồn tại" });
    } else {
      categoryDoc = await Category.findOne({
        name: { $regex: `^${category}$`, $options: "i" },
      });
      if (!categoryDoc)
        return res.status(404).json({ message: "Category không tồn tại" });
    }

    const products = await Product.find({ categoryId: categoryDoc._id });
    res.json({ products });
  } catch (error) {
    console.log("Error in getProductsByCategory controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server error while fetching categories" });
  }
};
module.exports = {
  getAllProductsBySeller,
  createProduct,
  deleteProduct,
  getRecommendedProducts,
  getProductsByCategory,
  getAllCategories,
};
