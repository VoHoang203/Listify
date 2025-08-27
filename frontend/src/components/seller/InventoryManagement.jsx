import { Package } from "lucide-react";
import AnalyticsTab from "../AnalyticsTab";

export default function InventoryManagement() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Package className="w-6 h-6" />
        Inventory Management
      </h2>
      <div className="bg-white rounded-lg shadow-md p-6">
        <AnalyticsTab />
      </div>
    </div>
  );
}
