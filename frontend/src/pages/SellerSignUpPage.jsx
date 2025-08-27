import React from "react";
import { useState } from "react";
import { Link } from "react-router";
import { UserPlus, Mail, Lock, User, ArrowRight, Loader } from "lucide-react";
import { Upload, X, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import axios from "../lib/axios";

const SellerSignUpPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;

    if (!user?.email) {
      toast.error("Không xác định được email người dùng. Hãy đăng nhập lại.");
      return;
    }

    const payload = {
      email: user.email,
      storeName: formData.name,
      description: formData.description,
      bannerDataUrl: imagePreview || null,
    };
    try {
      const res = await axios.post("/auth/register-seller", payload);
      toast.success("Đăng ký người bán thành công!");

      const updatedUser = {
        ...(user || {}),
        role: res.data?.user?.role || "seller",
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

     
    } catch (err) {
      toast.error(err?.response?.data?.message || "Đăng ký người bán thất bại");
    }
  };
  return (
    <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        className="sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="mt-6 text-center text-3xl font-extrabold text-emerald-400">
          Sign up to become a seller
        </h2>
      </motion.div>

      <motion.div
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="p-6 bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300"
              >
                Store name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Store name (eg: Shopii, ...)"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm
									 placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-300"
              >
                Store Description *
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Store Description..."
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                required
                className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm
									 placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>

            {/* Image Upload Field */}
            <div className="space-y-2">
              <label
                htmlFor="image"
                className="block text-sm font-medium text-gray-300"
              >
                Logo store
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg mx-auto"
                    />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center transition-colors"
                      onClick={removeImage}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                    <div className="text-sm text-gray-600">
                      <label htmlFor="image" className="cursor-pointer">
                        <span className="text-emerald-600 hover:text-emerald-700 hover:underline">
                          Upload image
                        </span>{" "}
                        or drag and drop
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF max 10MB
                    </p>
                  </div>
                )}
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Sign up
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SellerSignUpPage;
