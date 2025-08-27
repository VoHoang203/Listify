import { Star } from "lucide-react"

const mockFeedbacks = [
  {
    id: 1,
    productName: "Áo thun nam",
    productId: "PRD001",
    user: "Nguyễn Văn A",
    rating: 5,
    comment: "Sản phẩm chất lượng tốt, giao hàng nhanh",
    date: "2024-01-10",
  },
  {
    id: 2,
    productName: "Quần jean",
    productId: "PRD002",
    user: "Trần Thị B",
    rating: 4,
    comment: "Đẹp nhưng hơi chật",
    date: "2024-01-12",
  },
]

export default function FeedbackManagement() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Star className="w-6 h-6" />
        Quản lý Feedback Sản phẩm
      </h2>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Danh sách feedback</h3>
          <div className="space-y-4">
            {mockFeedbacks.map((feedback) => (
              <div key={feedback.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium">{feedback.productName}</h4>
                      <a
                        href={`#product/${feedback.productId}`}
                        className="text-blue-500 hover:text-blue-700 text-sm underline"
                      >
                        Xem sản phẩm
                      </a>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-gray-600">Từ: {feedback.user}</span>
                      <span className="text-sm text-gray-600">•</span>
                      <span className="text-sm text-gray-600">{feedback.date}</span>
                    </div>
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < feedback.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">({feedback.rating}/5)</span>
                    </div>
                    <p className="text-gray-700">{feedback.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
