"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { 
  Search, 
  Eye, 
  X, 
  Clock, 
  CheckCircle, 
  Package, 
  XCircle,
  Loader2,
} from "lucide-react"

interface Order {
  id: string
  order_no: string
  product_name: string
  quantity: number
  unit_price: number
  total_amount: number
  status: string
  buyer_email: string
  buyer_name: string
  delivered_content: string
  delivered_at: string
  created_at: string
  updated_at: string
  stripe_payment_intent_id: string | null // 易支付系统订单号
  epay_trade_no: string | null // 用户交易单号
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const statusConfig: Record<string, { icon: typeof Clock; color: string; text: string }> = {
  pending: { icon: Clock, color: "#fdd663", text: "待支付" },
  paid: { icon: CheckCircle, color: "#81c995", text: "已支付" },
  delivered: { icon: Package, color: "#7CFF00", text: "已发放" },
  cancelled: { icon: XCircle, color: "#ee675c", text: "已取消" },
  refunded: { icon: XCircle, color: "#9aa0a6", text: "已退款" },
}

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useSWR<Order[]>("/api/admin/orders", fetcher)
  const [searchOrderNo, setSearchOrderNo] = useState("")
  const [searchBuyer, setSearchBuyer] = useState("")
  const [searchContent, setSearchContent] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [statusTab, setStatusTab] = useState<"all" | "paid" | "pending">("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deliverContent, setDeliverContent] = useState("")
  const [isDelivering, setIsDelivering] = useState(false)

  // 过滤订单
  const filteredOrders = orders
    .filter(order => {
      // 状态过滤
      if (statusTab === "paid" && order.status !== "paid") return false
      if (statusTab === "pending" && order.status !== "pending") return false
      return true
    })
    .filter(order => {
      // 订单号过滤
      if (searchOrderNo && !order.order_no.toLowerCase().includes(searchOrderNo.toLowerCase())) return false
      // 买家联系方式过滤
      if (searchBuyer && !order.buyer_email?.toLowerCase().includes(searchBuyer.toLowerCase())) return false
      // 货物反查过滤（通过内容和产品名称）
      if (searchContent && !order.delivered_content?.toLowerCase().includes(searchContent.toLowerCase()) &&
          !order.product_name?.toLowerCase().includes(searchContent.toLowerCase())) return false
      return true
    })
    .filter(order => {
      // 日期范围过滤
      const orderDate = new Date(order.created_at)
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        if (orderDate < start) return false
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        if (orderDate > end) return false
      }
      return true
    })

  const handleDelete = async (orderId: string) => {
    if (!confirm("确定要删除这个订单吗？此操作不可恢复。")) return

    try {
      await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" })
      mutate("/api/admin/orders")
    } catch (error) {
      console.error("Delete error:", error)
    }
  }

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    paid: orders.filter((o) => o.status === "paid").length,
  }

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div>
        <h1 className="text-[22px] font-semibold text-[#e3e3e3]">订单管理</h1>
        <p className="text-[13px] text-[#9aa0a6] mt-0.5">共 {orders.length} 个订单</p>
      </div>

      {/* 状态 Tab */}
      <div className="flex items-center gap-0 border-b border-[#3c3c3f]">
        {[
          { key: "all", label: "全部" },
          { key: "paid", label: "已完成" },
          { key: "pending", label: "未付款" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusTab(tab.key as typeof statusTab)}
            className={`px-4 py-2.5 text-[14px] font-medium border-b-2 -mb-px transition-colors ${
              statusTab === tab.key
                ? "border-[#7CFF00] text-[#7CFF00]"
                : "border-transparent text-[#9aa0a6] hover:text-[#e3e3e3]"
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-[11px] ${statusTab === tab.key ? "text-[#7CFF00]/70" : "text-[#6e6e73]"}`}>
              {statusCounts[tab.key as keyof typeof statusCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 订单号 */}
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-[#9aa0a6] shrink-0">订单号</span>
          <input
            type="text"
            value={searchOrderNo}
            onChange={e => setSearchOrderNo(e.target.value)}
            placeholder="请输入订单号"
            className="h-8 px-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] text-[12px] focus:outline-none focus:border-[#7CFF00] transition-colors w-32"
          />
        </div>

        {/* 买家联系方式 */}
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-[#9aa0a6] shrink-0">买家联系方式</span>
          <input
            type="text"
            value={searchBuyer}
            onChange={e => setSearchBuyer(e.target.value)}
            placeholder="请输入买家联系方式"
            className="h-8 px-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] text-[12px] focus:outline-none focus:border-[#7CFF00] transition-colors w-36"
          />
        </div>

        {/* 货物反查 */}
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-[#9aa0a6] shrink-0">货物反查</span>
          <input
            type="text"
            value={searchContent}
            onChange={e => setSearchContent(e.target.value)}
            placeholder="请输入货物信息"
            className="h-8 px-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] text-[12px] focus:outline-none focus:border-[#7CFF00] transition-colors w-36"
          />
        </div>

        {/* 下单时间范围 */}
        <div className="flex items-center gap-1">
          <span className="text-[12px] text-[#9aa0a6]">下单时间</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="h-8 px-2 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] text-[11px] focus:outline-none focus:border-[#7CFF00]"
          />
          <span className="text-[12px] text-[#6e6e73]">-</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="h-8 px-2 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] text-[11px] focus:outline-none focus:border-[#7CFF00]"
          />
        </div>

        {/* 搜索按钮 */}
        <button
          onClick={() => {}}
          className="h-8 px-3 bg-[#7CFF00] hover:bg-[#9FFF40] text-[#131314] font-semibold rounded-lg text-[12px] transition-colors flex items-center gap-1"
        >
          <Search className="w-3.5 h-3.5" />
          搜索
        </button>

        {/* 清除筛选 */}
        {(searchOrderNo || searchBuyer || searchContent || startDate || endDate) && (
          <button
            onClick={() => {
              setSearchOrderNo("")
              setSearchBuyer("")
              setSearchContent("")
              setStartDate("")
              setEndDate("")
            }}
            className="h-8 px-2 text-[12px] text-[#6e6e73] hover:text-[#e3e3e3] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 订单列表 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#7CFF00]" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Package className="w-12 h-12 text-[#3c3c3f]" />
          <p className="text-[14px] text-[#6e6e73] font-medium">暂无订单数据</p>
        </div>
      ) : (
        <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#3c3c3f] bg-[#2d2e30]/40">
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6]">订单号</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6]">商品</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6] w-20">订单金额</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6] w-28">状态</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6]">创建时间</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-[#9aa0a6] w-20">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3c3c3f]">
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.pending
                  const StatusIcon = status.icon

                  return (
                    <tr key={order.id} className="hover:bg-[#2d2e30]/50 transition-colors">
                      {/* 订单号 */}
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-mono text-[#e3e3e3]">{order.order_no}</span>
                      </td>
                      {/* 商品 */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-[13px] font-medium text-[#e3e3e3]">{order.product_name}</p>
                          <p className="text-[12px] text-[#6e6e73]">x{order.quantity}</p>
                        </div>
                      </td>
                      {/* 订单金额 */}
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-semibold text-[#7CFF00]">¥{order.total_amount}</span>
                      </td>
                      {/* 状态 */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium"
                          style={{
                            backgroundColor: `${status.color}15`,
                            color: status.color,
                          }}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.text}
                        </span>
                      </td>
                      {/* 创建时间 */}
                      <td className="px-4 py-3">
                        <span className="text-[12px] text-[#6e6e73]">
                          {new Date(order.created_at).toLocaleString("zh-CN")}
                        </span>
                      </td>
                      {/* 操作 */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openModal(order)}
                          className="text-[12px] text-[#7CFF00] hover:text-[#9FFF40] transition-colors font-medium"
                        >
                          订单详情
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 订单详情弹窗 */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* 头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3c3f]">
              <h2 className="text-[18px] font-semibold text-[#e3e3e3]">订单详情</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-[#3c3c3f] rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-[#9aa0a6]" />
              </button>
            </div>

            {/* 内容 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 订单信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[12px] text-[#6e6e73]">订单号</span>
                  <p className="text-[14px] font-mono text-[#e3e3e3]">{selectedOrder.order_no}</p>
                </div>
                <div>
                  <span className="text-[12px] text-[#6e6e73]">状态</span>
                  <p className="text-[14px] text-[#e3e3e3]">
                    {statusConfig[selectedOrder.status]?.text || selectedOrder.status}
                  </p>
                </div>
                <div>
                  <span className="text-[12px] text-[#6e6e73]">产品</span>
                  <p className="text-[14px] text-[#e3e3e3]">{selectedOrder.product_name}</p>
                </div>
                <div>
                  <span className="text-[12px] text-[#6e6e73]">数量</span>
                  <p className="text-[14px] text-[#e3e3e3]">{selectedOrder.quantity}</p>
                </div>
                <div>
                  <span className="text-[12px] text-[#6e6e73]">单价</span>
                  <p className="text-[14px] text-[#e3e3e3]">¥{selectedOrder.unit_price}</p>
                </div>
                <div>
                  <span className="text-[12px] text-[#6e6e73]">总金额</span>
                  <p className="text-[14px] font-semibold text-[#7CFF00]">
                    ¥{selectedOrder.total_amount}
                  </p>
                </div>
                <div>
                  <span className="text-[12px] text-[#6e6e73]">买家邮箱</span>
                  <p className="text-[14px] text-[#e3e3e3]">{selectedOrder.buyer_email || "-"}</p>
                </div>
                <div>
                  <span className="text-[12px] text-[#6e6e73]">创建时间</span>
                  <p className="text-[14px] text-[#e3e3e3]">
                    {new Date(selectedOrder.created_at).toLocaleString("zh-CN")}
                  </p>
                </div>
              </div>
              
              {/* 交易��号信息 */}
              {selectedOrder.stripe_payment_intent_id && (
                <div className="mt-4 p-3 bg-[#2d2e30] rounded-lg">
                  <h4 className="text-[12px] font-semibold text-[#9aa0a6] mb-2">支付信息</h4>
                  <div className="space-y-2 text-[13px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6e6e73]">商户订单号:</span>
                      <span className="font-mono text-[#e3e3e3]">{selectedOrder.order_no}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6e6e73]">易支付订单号:</span>
                      <span className="font-mono text-[#81c995]">{selectedOrder.stripe_payment_intent_id}</span>
                    </div>
                    {selectedOrder.epay_trade_no && selectedOrder.epay_trade_no !== selectedOrder.stripe_payment_intent_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#6e6e73]">用户交易单号:</span>
                        <span className="font-mono text-[#7CFF00]">{selectedOrder.epay_trade_no}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 发放账号 */}
              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                  发放内容（账号信息）
                </label>
                <textarea
                  value={deliverContent}
                  onChange={(e) => setDeliverContent(e.target.value)}
                  placeholder="输入要发放给买家的账号信息..."
                  rows={5}
                  className="w-full px-4 py-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] placeholder-[#6e6e73] text-[13px] font-mono focus:outline-none focus:border-[#7CFF00] transition-colors resize-none"
                />
              </div>

              {selectedOrder.delivered_at && (
                <p className="text-[12px] text-[#81c995]">
                  已于 {new Date(selectedOrder.delivered_at).toLocaleString("zh-CN")} 发放
                </p>
              )}
            </div>

            {/* 底部 */}
            <div className="px-6 py-4 border-t border-[#3c3c3f] flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-[#2d2e30] hover:bg-[#3c3c3f] rounded-xl text-[14px] font-medium text-[#e3e3e3] transition-colors"
              >
                关闭
              </button>
              {(selectedOrder.status === "paid" || selectedOrder.status === "delivered") && (
                <button
                  onClick={handleDeliver}
                  disabled={isDelivering || !deliverContent.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#81c995] hover:bg-[#a8d4b8] disabled:bg-[#3c3c3f] disabled:cursor-not-allowed rounded-xl text-[14px] font-medium text-[#131314] disabled:text-[#6e6e73] transition-colors"
                >
                  {isDelivering ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      发放中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {selectedOrder.status === "delivered" ? "更新发放" : "发放账号"}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
