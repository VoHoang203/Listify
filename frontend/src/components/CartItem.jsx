import { Minus, Plus, Trash } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
const sameId = (a) => (a?._id ?? a ?? "").toString();

const CartItem = ({ item, coupon }) => {
  const { removeFromCart, updateQuantity } = useCartStore();
  const eligible =
    !!coupon &&
    sameId(item.sellerId) !== "" &&
    sameId(item.sellerId) === sameId(coupon.sellerId);
  const rate = eligible ? Number(coupon.discountPercentage) || 0 : 0;
  const rawPrice = Number(item.price) || 0;
  const discountedPrice = eligible
    ? Math.max(0, rawPrice * (1 - rate / 100))
    : rawPrice;
  return (
    <div className="rounded-lg border p-4 shadow-sm border-gray-700 bg-gray-800 md:p-6">
      <div className="space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0">
        <div className="shrink-0 md:order-1">
          <img className="h-20 md:h-32 rounded object-cover" src={item.image} />
          {eligible && rate > 0 && (
            <span className="absolute -top-2 -left-2 rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white shadow">
              -{rate}%
            </span>
          )}
        </div>
        <label className="sr-only">Choose quantity:</label>

        <div className="flex items-center justify-between md:order-3 md:justify-end">
          <div className="flex items-center gap-2">
            <button
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border
							 border-gray-600 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2
							  focus:ring-emerald-500"
              onClick={() => updateQuantity(item._id, item.quantity - 1)}
            >
              <Minus className="text-gray-300" />
            </button>
            <p>{item.quantity}</p>
            <button
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border
							 border-gray-600 bg-gray-700 hover:bg-gray-600 focus:outline-none 
						focus:ring-2 focus:ring-emerald-500"
              onClick={() => updateQuantity(item._id, item.quantity + 1)}
            >
              <Plus className="text-gray-300" />
            </button>
          </div>

          <div className="text-end md:order-4 md:w-40">
            <p className="text-base font-bold text-emerald-400">
              {eligible && rate > 0 ? (
              <div className="space-y-0.5">
                <p className="text-sm line-through text-gray-400">
                  ${rawPrice.toFixed(2)}
                </p>
                <p className="text-base font-bold text-emerald-400">
                  ${discountedPrice.toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-base font-bold text-emerald-400">
                ${rawPrice.toFixed(2)}
              </p>
            )}
            </p>
          </div>
        </div>

        <div className="w-full min-w-0 flex-1 space-y-4 md:order-2 md:max-w-md">
          <p className="text-base font-medium text-white hover:text-emerald-400 hover:underline">
            {item.name}
          </p>
          <p className="text-sm text-gray-400">{item.description}</p>

          <div className="flex items-center gap-4">
            <button
              className="inline-flex items-center text-sm font-medium text-red-400
							 hover:text-red-300 hover:underline"
              onClick={() => removeFromCart(item._id)}
            >
              <Trash />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CartItem;
