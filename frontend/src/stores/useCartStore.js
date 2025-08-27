import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

// ===== Helpers =====
const toId = (x) => {

  if (!x) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object" && x._id) return String(x._id);
  return String(x);
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Gắn/loại bỏ discountedPrice theo coupon.sellerId */
const applyDiscountsToCart = (cart, coupon) => {
  const percent = Number(coupon?.discountPercentage) || 0;
  const couponSeller = toId(coupon?.sellerId);
  if (!coupon || percent <= 0 || !couponSeller) {
    // clear discountedPrice
    return cart.map((it) => {
      const { discountedPrice, ...rest } = it;
      return rest;
    });
  }
  return cart.map((it) => {
    const match = toId(it?.sellerId) === couponSeller;
    if (!match) {
      const { discountedPrice, ...rest } = it;
      return rest;
    }
    const discounted = round2((Number(it.price) || 0) * (1 - percent / 100));
    return { ...it, price: discounted };
  });
};

// Tính subtotal/total dựa trên discountedPrice nếu có
const computeTotals = (cart) => {
  const subtotal = cart.reduce(
    (s, it) => s + (Number(it.price) || 0) * (it.quantity || 0),
    0
  );
  const total = cart.reduce(
    (s, it) =>
      s +
      (Number(it.discountedPrice ?? it.price) || 0) * (it.quantity || 0),
    0
  );
  return { subtotal: round2(subtotal), total: round2(total) };
};

export const useCartStore = create((set, get) => ({
  cart: JSON.parse(localStorage.getItem("carts")) || [],
  coupon: null,
  total: 0,
  subtotal: 0,
  isCouponApplied: false,

  // ===== Coupon =====
  getMyCoupon: async () => {
    try {
      const response = await axios.get("/coupons");
      set({ coupon: response.data });
    } catch (error) {
      console.error("Error fetching coupon:", error);
    }
  },

  applyCoupon: async (code) => {
    try {
      const response = await axios.post("/coupons/validate", { code });
      const coupon = response.data;

      // gắn discountedPrice vào các item hợp lệ theo seller
      const discountedCart = applyDiscountsToCart(get().cart, coupon);

      // persist + totals
      localStorage.setItem("carts", JSON.stringify(discountedCart));
      const { subtotal, total } = computeTotals(discountedCart);

      set({
        cart: discountedCart,
        coupon,
        isCouponApplied: true,
        subtotal,
        total,
      });

      toast.success("Coupon applied successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to apply coupon");
    }
  },

  removeCoupon: () => {
    // xoá discountedPrice khỏi từng item
    const cleaned = applyDiscountsToCart(get().cart, null);
    localStorage.setItem("carts", JSON.stringify(cleaned));
    const { subtotal, total } = computeTotals(cleaned);

    set({
      cart: cleaned,
      coupon: null,
      isCouponApplied: false,
      subtotal,
      total,
    });

    toast.success("Coupon removed");
  },

  // ===== Cart =====
  getCartItems: async () => {
    try {
      const res = await axios.get("/cart");
      let cart = res.data || [];

      // nếu đang có coupon, gắn discountedPrice tương ứng
      if (get().coupon) {
        cart = applyDiscountsToCart(cart, get().coupon);
      }

      localStorage.setItem("carts", JSON.stringify(cart));
      const { subtotal, total } = computeTotals(cart);
      set({ cart, subtotal, total });
    } catch (error) {
      set({ cart: [] });
      toast.error(error?.response?.data?.message || "An error occurred");
    }
  },

  clearCart: async () => {
    set({ cart: [], coupon: null, total: 0, subtotal: 0, isCouponApplied: false });
    localStorage.removeItem("carts");
  },

  addToCart: async (product) => {
    try {
      await axios.post("/cart", { productId: product._id });
      toast.success("Product added to cart");

      let newCart;
      set((prev) => {
        const existing = prev.cart.find((it) => it._id === product._id);
        newCart = existing
          ? prev.cart.map((it) =>
              it._id === product._id
                ? { ...it, quantity: (it.quantity || 0) + 1 }
                : it
            )
          : [...prev.cart, { ...product, quantity: 1 }];
        return { cart: newCart };
      });

      // re-apply discounts nếu đang có coupon
      if (get().coupon) {
        newCart = applyDiscountsToCart(newCart, get().coupon);
        set({ cart: newCart });
      }

      localStorage.setItem("carts", JSON.stringify(newCart));
      const { subtotal, total } = computeTotals(newCart);
      set({ subtotal, total });
    } catch (error) {
      toast.error(error?.response?.data?.message || "An error occurred");
    }
  },

  removeFromCart: async (productId) => {
    await axios.delete(`/cart`, { data: { productId } });

    let newCart;
    set((prev) => {
      newCart = prev.cart.filter((it) => it._id !== productId);
      return { cart: newCart };
    });

    // re-apply discounts nếu có coupon
    if (get().coupon) {
      newCart = applyDiscountsToCart(newCart, get().coupon);
      set({ cart: newCart });
    }

    localStorage.setItem("carts", JSON.stringify(newCart));
    const { subtotal, total } = computeTotals(newCart);
    set({ subtotal, total });
  },

  updateQuantity: async (productId, quantity) => {
    if (quantity === 0) {
      get().removeFromCart(productId);
      return;
    }

    await axios.put(`/cart/${productId}`, { quantity });

    let newCart;
    set((prev) => {
      newCart = prev.cart.map((it) =>
        it._id === productId ? { ...it, quantity } : it
      );
      return { cart: newCart };
    });

    // re-apply discounts nếu có coupon
    if (get().coupon) {
      newCart = applyDiscountsToCart(newCart, get().coupon);
      set({ cart: newCart });
    }

    localStorage.setItem("carts", JSON.stringify(newCart));
    const { subtotal, total } = computeTotals(newCart);
    set({ subtotal, total });
  },

  // ===== Helpers =====
  calculateTotals: () => {
    const { cart } = get();
    const { subtotal, total } = computeTotals(cart);
    set({ subtotal, total });
  },

  persistCart: () => {
    const { cart } = get();
    localStorage.setItem("carts", JSON.stringify(cart));
  },
}));
