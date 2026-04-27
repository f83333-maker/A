"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { 
  Search, 
  X, 
  Clock, 
  CheckCircle, 
  Package, 
  XCircle,
  Loader2,
  Trash2,
  Send,
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
  stripe_payment_intent_id: string | null
  epay_trade_no: string | null
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

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
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBatchDeleting, setIsBatchDeleting] = useState(false)
  
  // 弹窗状态
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deliverContent, setDeliverContent] = useState("")
  const [isDelivering, setIsDelivering] = useState(false)

  // 过滤订单
  const filteredOrders = orders
    .filter(order => {
      if (statusTab === "paid" && order.status !== "paid" && order.status !== "delivered") return false
      if (statusTab === "pending" && order.status !== "pending") return false
      return true
    })
    .filter(order => {
      if (searchOrderNo && !order.order_no.toLowerCase().includes(searchOrderNo.toLowerCase())) return false
      if (searchBuyer && !order.buyer_email?.toLowerCase().includes(searchBuyer.toLowerCase())) return false
      if (searchContent && !order.delivered_content?.toLowerCase().includes(searchContent.toLowerCase()) &&
          !order.product_name?.toLowerCase().includes(searchContent.toLowerCase())) return false
      return true
    })
    .filter(order => {
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

  const openModal = (order: Order) => {
    setSelectedOrder(order)
    setDeliverContent(order.delivered_content || "")
    setIsModalOpen(true)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredOrders.map(o => o.id))
    }
  }

  const handleBatchDelete = async () => {
    if (!confirm(`确定要彻底删除选中的 ${selectedIds.length} 个订单吗？此操作不可恢复！`)) return
    setIsBatchDeleting(true)
    try {
      await Promise.all(selectedIds.map(id =>
        fetch(`/api/admin/orders/${id}`, { method: "DELETE" })
      ))
      setSelectedIds([])
      mutate("/api/admin/orders")
    } catch (error) {
      console.error("批量删除失败:", error)
    } finally {
      setIsBatchDeleting(false)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("确定要彻底删除该订单吗？此操作不可恢复！")) return
    try {
      await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" })
      mutate("/api/admin/orders")
    } catch (error) {
      console.error("删除失败:", error)
    }
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
        }),
      })
      mutate("/api/admin/orders")
      setIsModalOpen(false)
    } catch (error) {
      console.error("发放失败:", error)
    } finally {
      setIsDelivering(false)
    }
  }

  const statusCounts = {
    all: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      paid: orders.filter((o) => o.status === "paid" || o.status === "delivered").length,
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
            className={`h-11 inline-flex items-center px-4 text-[14px] font-medium border-b-2 -mb-px transition-colors ${
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

        <button
          onClick={() => {}}
          className="h-8 px-3 bg-[#7CFF00]/10 hover:bg-[#7CFF00]/20 text-[#7CFF00] font-semibold rounded-lg text-[12px] transition-colors flex items-center gap-1"
        >
          <Search className="w-3.5 h-3.5" />
          搜索
        </button>

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

      {/* 批量操作条 */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#7CFF00]/8 border border-[#7CFF00]/20 rounded-xl">
          <span className="text-[12px] text-[#7CFF00] font-medium">已选 {selectedIds.length} 个订单</span>
          <div className="w-px h-4 bg-[#3c3c3f]" />
          <button
            onClick={handleBatchDelete}
            disabled={isBatchDeleting}
            className="flex items-center gap-1 text-[12px] text-[#ee675c] hover:text-[#f08c83] transition-colors font-medium disabled:opacity-50"
          >
            {isBatchDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            彻底删除
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="ml-auto text-[12px] text-[#6e6e73] hover:text-[#e3e3e3] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
                  <th className="pl-4 pr-1 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                      ref={el => { if (el) el.indeterminate = selectedIds.length > 0 && selectedIds.length < filteredOrders.length }}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded accent-[#7CFF00] cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#9aa0a6] whitespace-nowrap">订单号</th>
                  <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#9aa0a6] whitespace-nowrap">商品</th>
                  <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#9aa0a6] whitespace-nowrap">订单金额</th>
                  <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#9aa0a6] whitespace-nowrap">状态</th>
                  <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#9aa0a6] whitespace-nowrap">创建时间</th>
                  <th className="px-4 py-3 text-right text-[13px] font-semibold text-[#9aa0a6] whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3c3c3f]">
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.pending
                  const StatusIcon = status.icon

                  return (
                    <tr key={order.id} className={`hover:bg-[#2d2e30]/50 transition-colors ${selectedIds.includes(order.id) ? "bg-[#7CFF00]/5" : ""}`}>
                      <td className="pl-4 pr-1 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          className="w-3.5 h-3.5 rounded accent-[#7CFF00] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-mono text-[#e3e3e3]">{order.order_no}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-[13px] font-medium text-[#e3e3e3] truncate max-w-sm" title={order.product_name}>{order.product_name}</p>
                          <p className="text-[12px] text-[#6e6e73]">x{order.quantity}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-semibold text-[#7CFF00]">¥{order.total_amount}</span>
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
                        <span className="text-[12px] text-[#6e6e73]">
                          {new Date(order.created_at).toLocaleString("zh-CN")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => openModal(order)}
                          className="text-[12px] text-[#7CFF00] hover:text-[#9FFF40] transition-colors font-medium mr-2"
                        >
                          详情
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-[12px] text-[#9aa0a6] hover:text-[#ee675c] transition-colors font-medium"
                        >
                          删除
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
          <div className="relative bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] w-full max-w-4xl overflow-hidden flex flex-col">
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

            {/* 内容 - 左右两列横向布局 */}
            <div className="flex divide-x divide-[#3c3c3f]">
              {/* 左列：订单基本信息 */}
              <div className="flex-1 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <span className="text-[12px] font-semibold text-[#6e6e73]">订单号</span>
                    <p className="text-[13px] font-mono text-[#e3e3e3] mt-0.5 break-all">{selectedOrder.order_no}</p>
                  </div>
                  <div>
                    <span className="text-[12px] font-semibold text-[#6e6e73]">状态</span>
                    <p className="text-[14px] text-[#e3e3e3] mt-0.5">
                      {statusConfig[selectedOrder.status]?.text || selectedOrder.status}
                    </p>
                  </div>
                  <div>
                    <span className="text-[12px] font-semibold text-[#6e6e73]">产品</span>
                    <p className="text-[13px] text-[#e3e3e3] mt-0.5 truncate max-w-sm" title={selectedOrder.product_name}>{selectedOrder.product_name}</p>
                  </div>
                  <div>
                    <span className="text-[12px] font-semibold text-[#6e6e73]">数量</span>
                    <p className="text-[14px] text-[#e3e3e3] mt-0.5">{selectedOrder.quantity}</p>
                  </div>
                  <div>
                    <span className="text-[12px] font-semibold text-[#6e6e73]">单价</span>
                    <p className="text-[14px] text-[#e3e3e3] mt-0.5">¥{selectedOrder.unit_price}</p>
                  </div>
                  <div>
                    <span className="text-[12px] font-semibold text-[#6e6e73]">总金额</span>
                    <p className="text-[14px] font-semibold text-[#7CFF00] mt-0.5">¥{selectedOrder.total_amount}</p>
                  </div>
                  <div>
                    <span className="text-[12px] font-semibold text-[#6e6e73]">买家邮箱</span>
                    <p className="text-[13px] text-[#e3e3e3] mt-0.5">{selectedOrder.buyer_email || "-"}</p>
                  </div>
                  <div>
                    <span className="text-[12px] font-semibold text-[#6e6e73]">创建时间</span>
                    <p className="text-[13px] text-[#e3e3e3] mt-0.5">
                      {new Date(selectedOrder.created_at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                </div>

                {/* 支付信息 */}
                {selectedOrder.stripe_payment_intent_id && (
                  <div className="p-3 bg-[#2d2e30] rounded-lg">
                    <h4 className="text-[12px] font-semibold text-[#9aa0a6] mb-2">支付信息</h4>
                    <div className="space-y-2 text-[13px]">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-semibold text-[#6e6e73] shrink-0">商户订单号:</span>
                        <span className="font-mono text-[#e3e3e3] text-right break-all">{selectedOrder.order_no}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-semibold text-[#6e6e73] shrink-0">易支付订单号:</span>
                        <span className="font-mono text-[#81c995] text-right break-all">{selectedOrder.stripe_payment_intent_id}</span>
                      </div>
                      {selectedOrder.epay_trade_no && selectedOrder.epay_trade_no !== selectedOrder.stripe_payment_intent_id && (
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-semibold text-[#6e6e73] shrink-0">用户交易单号:</span>
                          <span className="font-mono text-[#7CFF00] text-right break-all">{selectedOrder.epay_trade_no}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 右列：发放内容 */}
              <div className="w-80 p-6 flex flex-col gap-4">
                <div className="flex-1 flex flex-col">
                  <label className="block text-[13px] font-medium text-[#9aa0a6] mb-2">
                    发放内容（账号信息）
                  </label>
                  <textarea
                    value={deliverContent}
                    onChange={(e) => setDeliverContent(e.target.value)}
                    placeholder="输入要发放给买家的账号信息..."
                    rows={8}
                    className="w-full flex-1 px-4 py-3 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] placeholder-[#6e6e73] text-[13px] font-mono focus:outline-none focus:border-[#7CFF00] transition-colors resize-none"
                  />
                </div>

                {selectedOrder.delivered_at && (
                  <p className="text-[12px] text-[#81c995]">
                    已于 {new Date(selectedOrder.delivered_at).toLocaleString("zh-CN")} 发放
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  {(selectedOrder.status === "paid" || selectedOrder.status === "delivered") && (
                    <button
                      onClick={handleDeliver}
                      disabled={isDelivering || !deliverContent.trim()}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#81c995]/10 hover:bg-[#81c995]/20 disabled:bg-[#3c3c3f] disabled:cursor-not-allowed rounded-xl text-[14px] font-medium text-[#81c995] disabled:text-[#6e6e73] transition-colors"
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
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-full px-4 py-2 bg-[#2d2e30] hover:bg-[#3c3c3f] rounded-xl text-[14px] font-medium text-[#e3e3e3] transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
