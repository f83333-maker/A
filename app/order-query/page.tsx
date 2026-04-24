"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Search, Package, Clock, CheckCircle, XCircle, Loader2, Copy, Check, Lock } from "lucide-react"

export default function OrderQueryPage() {
  const [orderNo, setOrderNo] = useState("")
  const [queryPassword, setQueryPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [needPassword, setNeedPassword] = useState(false)

  const handleSearch = async () => {
    if (!orderNo.trim()) {
      setError("请输入订单号")
      return
    }

    setLoading(true)
    setError("")
    setOrder(null)
    setNeedPassword(false)

    try {
      // 先查询订单基本信息
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNo.trim())}`)
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        return
      }

      if (data.order) {
        // 检查是否需要密码
        if (data.order.query_password === "***") {
          setNeedPassword(true)
          setOrder(data.order)
        } else {
          setOrder(data.order)
        }
      }
    } catch {
      setError("查询失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPassword = async () => {
    if (!queryPassword.trim()) {
      setError("请输入查询密码")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNo.trim())}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: queryPassword }),
      })
      const data = await res.json()

      if (data.success && data.order) {
        setOrder(data.order)
        setNeedPassword(false)
      } else {
        setError(data.error || "密码错误")
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
            <p className="text-[#9aa0a6]">输入订单号和查询密码查询订单状态和账号信息</p>
          </div>

          <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] p-6 mb-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="请输入订单号"
                  className="flex-1 h-12 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] placeholder-[#6e6e73] focus:outline-none focus:border-[#8ab4f8]"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-6 h-12 bg-[#8ab4f8] hover:bg-[#aecbfa] disabled:bg-[#3c3c3f] text-[#131314] font-semibold rounded-lg flex items-center gap-2 transition-colors"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  查询
                </button>
              </div>

              {/* 密码输入 */}
              {needPassword && (
                <div className="pt-4 border-t border-[#3c3c3f]">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-[#8ab4f8]" />
                    <span className="text-sm text-[#e3e3e3]">此订单需要验证查询密码</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={queryPassword}
                        onChange={(e) => setQueryPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
                        placeholder="请输入查询密码"
                        className="w-full h-12 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-lg text-[#e3e3e3] placeholder-[#6e6e73] focus:outline-none focus:border-[#8ab4f8]"
                      />
                    </div>
                    <button
                      onClick={handleVerifyPassword}
                      disabled={loading || !queryPassword.trim()}
                      className="px-6 h-12 bg-[#81c995] hover:bg-[#6ab583] disabled:bg-[#3c3c3f] text-[#131314] font-semibold rounded-lg flex items-center gap-2 transition-colors"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "验证"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-[#ee675c]/10 border border-[#ee675c]/30 rounded-lg">
                <p className="text-[#ee675c] text-sm">{error}</p>
              </div>
            )}
          </div>

          {order && !needPassword && (
            <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] overflow-hidden selectable">
              <div className="p-6 border-b border-[#3c3c3f]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[#e3e3e3]">{order.product_name}</h2>
                  {(() => {
                    const status = getStatusInfo(order.status)
                    const Icon = status.icon
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>
                        <Icon className="w-4 h-4" />
                        {status.text}
                      </span>
                    )
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#6e6e73]">订单号:</span>
                    <span className="ml-2 text-[#e3e3e3]">{order.order_no}</span>
                  </div>
                  <div>
                    <span className="text-[#6e6e73]">数量:</span>
                    <span className="ml-2 text-[#e3e3e3]">{order.quantity}</span>
                  </div>
                  <div>
                    <span className="text-[#6e6e73]">单价:</span>
                    <span className="ml-2 text-[#e3e3e3]">¥{order.unit_price}</span>
                  </div>
                  <div>
                    <span className="text-[#6e6e73]">总金额:</span>
                    <span className="ml-2 text-[#8ab4f8] font-semibold">¥{order.total_amount}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#6e6e73]">下单时间:</span>
                    <span className="ml-2 text-[#e3e3e3]">{new Date(order.created_at).toLocaleString("zh-CN")}</span>
                  </div>
                </div>
              </div>

              {order.delivered_content && (
                <div className="p-6 border-b border-[#3c3c3f]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#81c995]">账号信息</h3>
                    <button
                      onClick={() => handleCopy(order.delivered_content)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2d2e30] hover:bg-[#3c3c3f] rounded-lg text-xs text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "已复制" : "复制"}
                    </button>
                  </div>
                  <div className="bg-[#2d2e30] rounded-lg p-4">
                    <pre className="text-sm text-[#e3e3e3] whitespace-pre-wrap break-all font-mono">
                      {order.delivered_content}
                    </pre>
                  </div>
                </div>
              )}

              {order.usage_instructions && (
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-[#8ab4f8] mb-3">使用说明</h3>
                  <div
                    className="prose prose-invert prose-sm max-w-none text-[#e3e3e3] [&_img]:rounded-xl [&_img]:max-w-full [&_img]:h-auto [&_a]:text-[#8ab4f8] [&_a:hover]:underline"
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
