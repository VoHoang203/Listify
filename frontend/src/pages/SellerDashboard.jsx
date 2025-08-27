import { useState } from "react"
import { Package, ShoppingBag, Ticket, Store, ShoppingCart, Star, X, Menu, LogOut, ArrowRightLeft, User } from "lucide-react"

import ProductManagement from "../components/seller/ProductManagemanet"
import OrderManagement from "../components/seller/OrderManagement"
import VoucherManagement from "../components/seller/VoucherManagement"
import ProfileManagement from "../components/seller/ProfileManagement"
import FeedbackManagement from "../components/seller/FeedbackManagement"
import InventoryManagement from "../components/seller/InventoryManagement"
import { useNavigate } from "react-router"
import { useUserStore } from "../stores/useUserStore"

export default function SellerDashboard() {
  const [activeMenu, setActiveMenu] = useState("inventory")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showUserPopup, setShowUserPopup] = useState(false)
  const menuItems = [
    { id: "inventory", label: "Inventory Management", icon: Package },
    { id: "products", label: "Product Management", icon: ShoppingBag },
    { id: "vouchers", label: "Voucher Management", icon: Ticket },
    { id: "profile", label: "Store Profile Management", icon: Store },
    { id: "orders", label: "Order Management", icon: ShoppingCart },
    { id: "feedback", label: "Product Feedback Management", icon: Star },
  ]

  const renderContent = () => {
    switch (activeMenu) {
      case "inventory":
        return <InventoryManagement />
      case "products":
        return <ProductManagement />
      case "vouchers":
        return <VoucherManagement />
      case "profile":
        return <ProfileManagement />
      case "orders":
        return <OrderManagement />
      case "feedback":
        return <FeedbackManagement />
      default:
        return <InventoryManagement />
    }
  }
const navigate = useNavigate();
  const logout = useUserStore((s) => s.logout);
  const user = useUserStore((s) => s.user);

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserPopup(false);
      navigate("/"); // chuyển về trang chủ
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleSwitchToBuyer = () => {
    // tuỳ logic của bạn, ví dụ gán role lại hoặc chỉ navigate
    // giả định là navigate ra Home
    setShowUserPopup(false);
    navigate("/");
  };
  return (
    <div className="flex h-screen bg-gray-100">
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-gray-200 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarCollapsed ? "lg:w-16" : "lg:w-64"}`}
        style={{ width: sidebarOpen ? "16rem" : sidebarCollapsed ? "4rem" : "16rem" }}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-gray-300">
          {!sidebarCollapsed && <h1 className="text-lg font-bold text-gray-800">Seller Dashboard</h1>}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:block text-gray-600 hover:text-gray-800 p-1"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-600 hover:text-gray-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <nav className="mt-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-300 transition-colors ${
                  activeMenu === item.id ? "bg-gray-300 border-r-4 border-blue-500" : ""
                } ${sidebarCollapsed ? "justify-center" : ""}`}
                title={sidebarCollapsed ? item.label : ""}
              >
                <IconComponent className={`text-gray-700 ${sidebarCollapsed ? "w-7 h-7" : "w-7 h-7 mr-3"}`} />
                {!sidebarCollapsed && <span className="text-gray-800">{item.label}</span>}
              </button>
            )
          })}
        </nav>
        <div className="relative mb-4">
            <div
              className={`flex items-center px-4 py-3 hover:bg-gray-300 transition-colors cursor-pointer ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
              onClick={() => setShowUserPopup(!showUserPopup)}
              title={sidebarCollapsed ? "User Menu" : ""}
            >
              <User className={`text-gray-700 ${sidebarCollapsed ? "w-7 h-7" : "w-7 h-7 mr-3"}`} />
              {!sidebarCollapsed && <span className="text-gray-800">{user.name}</span>}
            </div>

            
          </div>
          {showUserPopup && (
              <div className="bg-white rounded-lg shadow-lg border py-2 mx-2 mb-2">
                <button
                  onClick={() => {
                    handleSwitchToBuyer()
                    setShowUserPopup(false)
                  }}
                  className="w-full flex items-center px-4 py-2 text-left hover:bg-gray-100 transition-colors text-gray-700"
                >
                  <ArrowRightLeft className="w-5 h-5 mr-3" />
                  {!sidebarCollapsed && <span>Switch to Buyer</span>}
                </button>
                <button
                  onClick={() => {
                    handleLogout()
                    setShowUserPopup(false)
                  }}
                  className="w-full flex items-center px-4 py-2 text-left hover:bg-gray-100 transition-colors text-red-600"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  {!sidebarCollapsed && <span>Logout</span>}
                </button>
              </div>
            )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-800">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">Seller Dashboard</h1>
            <div></div>
          </div>
        </div>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">{renderContent()}</main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  )
}
