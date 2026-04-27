"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Search, Package, Clock, CheckCircle, XCircle, Loader2, Copy, Check, Lock } from "lucide-react"

export default function OrderQueryPage() {
  const [queryValue, setQueryValue] = useState("")
  const [queryPassword, setQueryPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [needPassword, setNeedPassword] = useState(false)
  // 记录当前要验证密码的订单号
  const [pendingOrderNo, setPendingOrderNo] = useState("")

  // 自动判断输入是订单号还是联系方式
  // 订单号特征：以字母开头或全是数字且长度较长（>10位）
  const isOrderNo = (val: string) => {
    return /^[A-Za-z][A-Za-z0-9]+/.test(val.trim()) && !val.includes("@") && !/^\d{5,10}$/.test(val.trim())
  }

  const handleSearch = async () => {
    const val = queryValue.trim()
    if (!val) {
      setError("请输入订单号或联系方式")
      return
    }

    setLoading(true)
    setError("")
    setOrder(null)
    setOrders([])
    setNeedPassword(false)
    setPendingOrderNo("")

    try {
      const params = new URLSearchParams()
      if (isOrderNo(val)) {
        params.set("orderNo", val)
      } else {
        params.set("contact", val)
      }

      const res = await fetch(`/api/orders/query?${params.toString()}`)
      const data = await res.json()

      if (!data.success) {
        setError(data.error || "查询失败")
        return
      }

      if (data.order) {
        if (data.order.query_password === "***") {
          setNeedPassword(true)
          setPendingOrderNo(data.order.order_no)
          setOrder(data.order)
        } else {
          setOrder(data.order)
        }
      }

      if (data.orders) {
        setOrders(data.orders)
      }
    } catch {
      setError("查询失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOrder = async (selectedOrder: any) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(selectedOrder.order_no)}`)
      const data = await res.json()
      if (data.order) {
        setOrders([])
        if (data.order.query_password === "***") {
          setNeedPassword(true)
          setPendingOrderNo(data.order.order_no)
          setOrder(data.order)
        } else {
          setOrder(data.order)
        }
      } else {
        setError(data.error || "获取订单详情失败")
      }
    } catch {
      setError("获取订单详情失败")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPassword = async () => {
    if (!queryPassword.trim()) {
      setError("请输入查询密码")
      return
    }
    if (!pendingOrderNo) {
      setError("订单信息丢失，请重新查询")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(pendingOrderNo)}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: queryPassword }),
      })
      const data = await res.json()

      if (data.success && data.order) {
        setOrder(data.order)
        setNeedPassword(false)
        setPendingOrderNo("")
      } else {
        setError(data.error || "密码错误，请重新输入")
      }
    } catch {
      setError("验证失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "paid":
      case "delivered":
        return { icon: CheckCircle, color: "text-[#81c995]", bg: "bg-[#81c995]/10", text: "已完成" }
      case "pending":
        return { icon: Clock, color: "text-[#fdd663]", bg: "bg-[#fdd663]/10", text: "待支付" }
      case "cancelled":
      case "refunded":
        return { icon: XCircle, color: "text-[#ee675c]", bg: "bg-[#ee675c]/10", text: "已取消" }
      default:
        return { icon: Package, color: "text-[#9aa0a6]", bg: "bg-[#9aa0a6]/10", text: status }
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#131314]">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#e3e3e3] mb-2">订单查询</h1>
            <p className="text-[#9aa0a6]">输入订单号或购买时填写的联系方式查询您的订单</p>
          </div>

          <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] p-6 mb-6">
            <div className="space-y-4">
              {/* 单一输入框 */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={queryValue}
                  onChange={(e) => { setQueryValue(e.target.value); setError("") }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="订单号 / 邮箱 / 手机号 / QQ"
                  className="flex-1 h-12 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] placeholder-[#6e6e73] focus:outline-none focus:border-[#7CFF00] transition-colors"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-6 h-12 bg-[#7CFF00]/10 hover:bg-[#7CFF00]/20 disabled:opacity-50 disabled:cursor-not-allowed text-[#7CFF00] font-semibold rounded-lg flex items-center gap-2 transition-colors"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  查询
                </button>
              </div>

              <p className="text-[12px] text-[#6e6e73]">支持输入订单号或购买时预留的邮箱、手机号、QQ号进行查询</p>

              {/* 密码验证 */}
              {needPassword && (
                <div className="pt-4 border-t border-[#3c3c3f]">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-[#7CFF00]" />
                    <span className="text-[13px] text-[#e3e3e3]">此订单设置了查询密码，请输入后查看账号信息</span>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={queryPassword}
                      onChange={(e) => { setQueryPassword(e.target.value); setError("") }}
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
                      placeholder="请输入查询密码"
                      className="flex-1 h-12 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] placeholder-[#6e6e73] focus:outline-none focus:border-[#7CFF00] transition-colors"
                    />
                    <button
                      onClick={handleVerifyPassword}
                      disabled={loading || !queryPassword.trim()}
                      className="px-6 h-12 bg-[#7CFF00]/10 hover:bg-[#7CFF00]/20 disabled:opacity-50 disabled:cursor-not-allowed text-[#7CFF00] font-semibold rounded-lg transition-colors"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "验证"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-[#ee675c]/10 border border-[#ee675c]/30 rounded-lg">
                <p className="text-[#ee675c] text-[13px]">{error}</p>
              </div>
            )}
          </div>

          {/* 多订单列表（联系方式查询结果） */}
          {orders.length > 0 && (
            <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-[#3c3c3f]">
                <h2 className="text-[15px] font-semibold text-[#e3e3e3]">找到 {orders.length} 个订单</h2>
                <p className="text-[12px] text-[#6e6e73] mt-1">点击订单查看详情</p>
              </div>
              <div className="divide-y divide-[#3c3c3f]">
                {orders.map((o) => {
                  const status = getStatusInfo(o.status)
                  const Icon = status.icon
                  return (
                    <button
                      key={o.id}
                      onClick={() => handleSelectOrder(o)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#2d2e30] transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] text-[#e3e3e3] font-medium truncate">{o.product_name}</p>
                        <p className="text-[12px] text-[#6e6e73] mt-1">
                          {o.order_no} · {new Date(o.created_at).toLocaleDateString("zh-CN")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        <span className="text-[#7CFF00] font-semibold text-[14px]">¥{o.total_amount}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${status.bg} ${status.color}`}>
                          <Icon className="w-3 h-3" />
                          {status.text}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 订单详情 */}
          {order && !needPassword && (
            <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] overflow-hidden selectable">
              <div className="p-6 border-b border-[#3c3c3f]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[16px] font-semibold text-[#e3e3e3]">{order.product_name}</h2>
                  {(() => {
                    const status = getStatusInfo(order.status)
                    const Icon = status.icon
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium ${status.bg} ${status.color}`}>
                        <Icon className="w-4 h-4" />
                        {status.text}
                      </span>
                    )
                  })()}
                </div>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <span className="text-[#6e6e73]">订单号</span>
                    <p className="text-[#e3e3e3] mt-0.5">{order.order_no}</p>
                  </div>
                  <div>
                    <span className="text-[#6e6e73]">数量</span>
                    <p className="text-[#e3e3e3] mt-0.5">{order.quantity}</p>
                  </div>
                  <div>
                    <span className="text-[#6e6e73]">单价</span>
                    <p className="text-[#e3e3e3] mt-0.5">¥{order.unit_price}</p>
                  </div>
                  <div>
                    <span className="text-[#6e6e73]">总金额</span>
                    <p className="text-[#7CFF00] font-semibold mt-0.5">¥{order.total_amount}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#6e6e73]">下单时间</span>
                    <p className="text-[#e3e3e3] mt-0.5">{new Date(order.created_at).toLocaleString("zh-CN")}</p>
                  </div>
                </div>
              </div>

              {order.delivered_content && (
                <div className="p-6 border-b border-[#3c3c3f]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-semibold text-[#81c995]">账号信息</h3>
                    <button
                      onClick={() => handleCopy(order.delivered_content)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2d2e30] hover:bg-[#3c3c3f] rounded-lg text-[12px] text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "已复制" : "复制"}
                    </button>
                  </div>
                  <div className="bg-[#2d2e30] rounded-lg p-4">
                    <pre className="text-[13px] text-[#e3e3e3] whitespace-pre-wrap break-all font-mono">
                      {order.delivered_content}
                    </pre>
                  </div>
                </div>
              )}

              {order.usage_instructions && (
                <div className="p-6">
                  <h3 className="text-[13px] font-semibold text-[#7CFF00] mb-3">使用说明</h3>
                  <div
                    className="prose prose-invert prose-sm max-w-none text-[#e3e3e3] [&_img]:rounded-xl [&_img]:max-w-full [&_a]:text-[#7CFF00] [&_a:hover]:underline"
                    dangerouslySetInnerHTML={{ __html: order.usage_instructions }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
