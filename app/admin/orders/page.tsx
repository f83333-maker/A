"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  const router = useRouter()
  const { data: orders = [], isLoading } = useSWR<Order[]>("/api/admin/orders", fetcher)
  const [searchOrderNo, setSearchOrderNo] = useState("")
  const [searchBuyer, setSearchBuyer] = useState("")
  const [searchContent, setSearchContent] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [statusTab, setStatusTab] = useState<"all" | "paid" | "pending">("all")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBatchDeleting, setIsBatchDeleting] = useState(false)

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
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6]">订单号</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6]">商品</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6] w-20">订单金额</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6] w-28">状态</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6]">创建时间</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-[#9aa0a6] w-28">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3c3c3f]">
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.pending
                  const StatusIcon = status.icon

                  return (
                    <tr key={order.id} className={`hover:bg-[#2d2e30]/50 transition-colors ${selectedIds.includes(order.id) ? "bg-[#7CFF00]/5" : ""}`}>
                      {/* 复选框 */}
                      <td className="pl-4 pr-1 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          className="w-3.5 h-3.5 rounded accent-[#7CFF00] cursor-pointer"
                        />
                      </td>
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
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
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

    </div>
  )
}
