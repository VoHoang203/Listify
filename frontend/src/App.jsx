import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router";
import { Toaster } from "react-hot-toast";

import "./App.css";
import "./index.css";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import CategoryPage from "./pages/CategoryPage";
import SellerSignUpPage from "./pages/SellerSignUpPage";
import SellerDashboard from "./pages/SellerDashboard";

import Navbar from "./components/Navbar";
import { useUserStore } from "./stores/useUserStore";
import CartPage from "./pages/CartPage";
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage";
import PurchaseCancelPage from "./pages/PurchaseCancelPage";
import ChatPage from "./pages/ChatPage";

/* ---------------- Guards ---------------- */
function RequireSeller({ children }) {
  const { user } = useUserStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.role !== "seller") {
    return <Navigate to="/" replace />;
  }

  return children;
}

/* ---------------- Layouts ---------------- */
const MainLayout = () => (
  <>
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.3)_0%,rgba(10,80,60,0.2)_45%,rgba(0,0,0,0.1)_100%)]" />
      </div>
    </div>
    <div className="relative z-50 pt-20">
      <Navbar />
      <Outlet />
    </div>
  </>
);

const DashboardLayout = () => (
  <div className="min-h-screen">
    <Outlet />
  </div>
);

/* ---------------- App ---------------- */
export default function App() {
  const initializeUser = useUserStore((s) => s.initializeUser);
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    initializeUser(); // restore from cookies / refresh-token
  }, [initializeUser]);

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/signup"
            element={!user ? <SignUpPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/login"
            element={!user ? <LoginPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/register-seller"
            element={user ? <SellerSignUpPage /> : <Navigate to="/" replace />}
          />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/purchase-success" element={<PurchaseSuccessPage />} />
          <Route path="/purchase-cancel" element={<PurchaseCancelPage />} />
          <Route path="/chat" element={user ? <ChatPage /> : <Navigate to="/" replace />} />
        </Route>

        <Route element={<DashboardLayout />}>
          <Route
            path="/secret-dashboard"
            element={
              <RequireSeller>
                <SellerDashboard />
              </RequireSeller>
            }
          />
        </Route>
      </Routes>

      <Toaster />
    </div>
  );
}
