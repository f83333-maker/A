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
  RefreshCw,
  Send,
  Trash2,
  Download,
  Filter,
  Calendar
} from "lucide-react"
import * as XLSX from "xlsx"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [productFilter, setProductFilter] = useState<string>("all")
  const [amountFilter, setAmountFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deliverContent, setDeliverContent] = useState("")
  const [isDelivering, setIsDelivering] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  
  // 获取所有产品名称用于筛选
  const productNames = [...new Set(orders.map(o => o.product_name))].sort()

  // 日期筛选
  const getDateFilteredOrders = (orderList: Order[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return orderList.filter((order) => {
      const orderDate = new Date(order.created_at)
      switch (dateFilter) {
        case "today":
          return orderDate >= today
        case "yesterday":
          return orderDate >= yesterday && orderDate < today
        case "week":
          return orderDate >= thisWeek
        case "month":
          return orderDate >= thisMonth
        default:
          return true
      }
    })
  }

  const filteredOrders = getDateFilteredOrders(orders).filter((order) => {
    const matchesSearch =
      order.order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.buyer_email?.toLowerCase().includes(searchQuery.toLowerCase()) || false)

    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    
    const matchesProduct = productFilter === "all" || order.product_name === productFilter
    
    // 金额筛选
    let matchesAmount = true
    if (amountFilter !== "all") {
      const amount = order.total_amount
      switch (amountFilter) {
        case "0-10":
          matchesAmount = amount >= 0 && amount < 10
          break
        case "10-50":
          matchesAmount = amount >= 10 && amount < 50
          break
        case "50-100":
          matchesAmount = amount >= 50 && amount < 100
          break
        case "100-500":
          matchesAmount = amount >= 100 && amount < 500
          break
        case "500+":
          matchesAmount = amount >= 500
          break
      }
    }

    return matchesSearch && matchesStatus && matchesProduct && matchesAmount
  })

  const openModal = (order: Order) => {
    setSelectedOrder(order)
    setDeliverContent(order.delivered_content || "")
    setIsModalOpen(true)
  }

  const handleDeliver = async () => {
    if (!selectedOrder || !deliverContent.trim()) return

    setIsDelivering(true)
    try {
      await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "delivered",
          delivered_content: deliverContent,
          delivered_at: new Date().toISOString(),
        }),
      })

      mutate("/api/admin/orders")
      setIsModalOpen(false)
    } catch (error) {
      console.error("Deliver error:", error)
    } finally {
      setIsDelivering(false)
    }
  }

  const handleDelete = async (orderId: string) => {
    if (!confirm("确定要删除这个订单吗？此操作不可恢复。")) return

    try {
      await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" })
      mutate("/api/admin/orders")
    } catch (error) {
      console.error("Delete error:", error)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedOrders.length === 0) return
    if (!confirm(`确定要删除选中的 ${selectedOrders.length} 个订单吗？此操作不可恢复。`)) return

    setIsDeleting(true)
    try {
      await Promise.all(
        selectedOrders.map((id) =>
          fetch(`/api/admin/orders/${id}`, { method: "DELETE" })
        )
      )
      setSelectedOrders([])
      mutate("/api/admin/orders")
    } catch (error) {
      console.error("Batch delete error:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExportExcel = () => {
    const exportData = filteredOrders.map((order) => ({
      订单号: order.order_no,
      产品名称: order.product_name,
      数量: order.quantity,
      单价: order.unit_price,
      总金额: order.total_amount,
      状态: statusConfig[order.status]?.text || order.status,
      买家邮箱: order.buyer_email || "-",
      创建时间: new Date(order.created_at).toLocaleString("zh-CN"),
      发货内容: order.delivered_content || "-",
      发货时间: order.delivered_at ? new Date(order.delivered_at).toLocaleString("zh-CN") : "-",
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "订单列表")
    
    const fileName = `订单导出_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "-")}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(filteredOrders.map((o) => o.id))
    }
  }

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    paid: orders.filter((o) => o.status === "paid").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-[#e3e3e3]">订单管理</h1>
          <p className="text-[14px] text-[#9aa0a6] mt-1 font-medium">
            管理所有订单，查看支付状态和发放账号
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-[#81c995] hover:bg-[#a8d4b8] rounded-xl text-[14px] font-medium text-[#131314] transition-colors"
          >
            <Download className="w-4 h-4" />
            导出Excel
          </button>
          <button
            onClick={() => mutate("/api/admin/orders")}
            className="flex items-center gap-2 px-4 py-2 bg-[#2d2e30] hover:bg-[#3c3c3f] rounded-xl text-[14px] font-medium text-[#e3e3e3] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>

      {/* 筛选区域 */}
      <div className="flex flex-wrap gap-4">
        {/* 状态筛选 */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all", label: "全部" },
            { key: "pending", label: "待支付" },
            { key: "paid", label: "已支付" },
            { key: "delivered", label: "已发放" },
            { key: "cancelled", label: "已取消" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                statusFilter === item.key
                  ? "bg-[#7CFF00] text-[#131314]"
                  : "bg-[#2d2e30] text-[#9aa0a6] hover:bg-[#3c3c3f] hover:text-[#e3e3e3]"
              }`}
            >
              {item.label} ({statusCounts[item.key as keyof typeof statusCounts]})
            </button>
          ))}
        </div>

        {/* 日期筛选 */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#6e6e73]" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[13px] text-[#e3e3e3] focus:outline-none focus:border-[#7CFF00]"
          >
            <option value="all">全部时间</option>
            <option value="today">今天</option>
            <option value="yesterday">昨天</option>
            <option value="week">近7天</option>
            <option value="month">本月</option>
          </select>
        </div>
        
        {/* 产品筛选 */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#6e6e73]" />
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="px-3 py-2 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[13px] text-[#e3e3e3] focus:outline-none focus:border-[#7CFF00] max-w-[150px]"
          >
            <option value="all">全部产品</option>
            {productNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        
        {/* 金额筛选 */}
        <select
          value={amountFilter}
          onChange={(e) => setAmountFilter(e.target.value)}
          className="px-3 py-2 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[13px] text-[#e3e3e3] focus:outline-none focus:border-[#7CFF00]"
        >
          <option value="all">全部金额</option>
          <option value="0-10">¥0 - ¥10</option>
          <option value="10-50">¥10 - ¥50</option>
          <option value="50-100">¥50 - ¥100</option>
          <option value="100-500">¥100 - ¥500</option>
          <option value="500+">¥500+</option>
        </select>
      </div>

      {/* 搜索框和批量操作 */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6e6e73]" />
          <input
            type="text"
            placeholder="搜索订单号、产品名称或买家邮箱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-[#1e1f20] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] placeholder-[#6e6e73] text-[14px] focus:outline-none focus:border-[#7CFF00] transition-colors"
          />
        </div>
        {selectedOrders.length > 0 && (
          <button
            onClick={handleBatchDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-[#ee675c] hover:bg-[#f08c83] rounded-xl text-[14px] font-medium text-white transition-colors disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            删除选中 ({selectedOrders.length})
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
                <tr className="border-b border-[#3c3c3f]">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6] uppercase">
                    订单号
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6] uppercase">
                    产品
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6] uppercase">
                    金额
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6] uppercase">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6] uppercase">
                    买家
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6] uppercase">
                    时间
                  </th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-[#9aa0a6] uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3c3c3f]">
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.pending
                  const StatusIcon = status.icon

                  return (
                    <tr key={order.id} className="hover:bg-[#2d2e30]/50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="w-4 h-4 rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-mono text-[#e3e3e3]">
                          {order.order_no}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-[13px] font-medium text-[#e3e3e3]">
                            {order.product_name}
                          </p>
                          <p className="text-[12px] text-[#6e6e73]">x{order.quantity}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[14px] font-semibold text-[#7CFF00]">
                          ¥{order.total_amount}
                        </span>
                      </td>
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
                      <td className="px-4 py-3">
                        <span className="text-[13px] text-[#9aa0a6]">
                          {order.buyer_email || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] text-[#6e6e73]">
                          {new Date(order.created_at).toLocaleString("zh-CN")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openModal(order)}
                            className="p-2 hover:bg-[#3c3c3f] rounded-lg transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4 text-[#9aa0a6]" />
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="p-2 hover:bg-[#ee675c]/10 rounded-lg transition-colors"
                            title="删除订单"
                          >
                            <Trash2 className="w-4 h-4 text-[#ee675c]" />
                          </button>
                        </div>
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
              
              {/* 交易单号信息 */}
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
