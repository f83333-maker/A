"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Clock, Package, ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { CopyButton } from "@/components/copy-button"

interface Order {
  id: string
  order_no: string
  product_name: string
  quantity: number
  unit_price: number
  total_amount: number
  status: string
  delivered_content: string | null
  delivered_at: string | null
  created_at: string
  query_password: string | null
  usage_instructions: string | null
}

function OrderContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orderNo = params.orderNo as string
  const tradeNo = searchParams.get("trade_no")

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState("")
  const [passwordVerified, setPasswordVerified] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [polling, setPolling] = useState(false)

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderNo}`)
      const data = await res.json()
      if (data.order) {
        setOrder(data.order)
        // 如果订单没有设置密码，自动跳过验证
        if (!data.order.query_password) {
          setPasswordVerified(true)
        }
        return data.order
      }
    } catch (error) {
      console.error("获取订单失败:", error)
    }
    return null
  }, [orderNo])

  useEffect(() => {
    async function init() {
      const orderData = await fetchOrder()
      setLoading(false)
      
      // 如果从支付页面返回且订单是待支付状态，启动轮询
      if (tradeNo && orderData?.status === "pending") {
        setPolling(true)
        let attempts = 0
        const maxAttempts = 20 // 最多轮询20次（约40秒）
        
        const pollInterval = setInterval(async () => {
          attempts++
          const updated = await fetchOrder()
          if (updated?.status !== "pending" || attempts >= maxAttempts) {
            clearInterval(pollInterval)
            setPolling(false)
          }
        }, 2000) // 每2秒检查一次
        
        return () => clearInterval(pollInterval)
      }
    }
    init()
  }, [orderNo, tradeNo, fetchOrder])

  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      setPasswordError("请输入查询密码")
      return
    }

    setVerifying(true)
    setPasswordError("")

    try {
      const res = await fetch(`/api/orders/${orderNo}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()

      if (data.success && data.order) {
        setOrder(data.order)
        setPasswordVerified(true)
      } else {
        setPasswordError(data.error || "密码错误")
      }
    } catch (error) {
      setPasswordError("验证失败，请重试")
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131314] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7CFF00]" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#131314] py-8 px-4">
        <div className="max-w-2xl mx-auto text-center py-20">
          <XCircle className="w-16 h-16 mx-auto text-[#ee675c] mb-4" />
          <h1 className="text-xl font-semibold text-[#e3e3e3] mb-2">订单不存在</h1>
          <p className="text-[#9aa0a6] mb-6">请检查订单号是否正确</p>
          <Link href="/" className="text-[#7CFF00] hover:underline">返回首页</Link>
        </div>
      </div>
    )
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "#fdd663",
      bgColor: "bg-[#fdd663]/10",
      borderColor: "border-[#fdd663]/30",
      text: "待支付",
    },
    paid: {
      icon: CheckCircle,
      color: "#81c995",
      bgColor: "bg-[#81c995]/10",
      borderColor: "border-[#81c995]/30",
      text: "已支付",
    },
    delivered: {
      icon: Package,
      color: "#7CFF00",
      bgColor: "bg-[#7CFF00]/10",
      borderColor: "border-[#7CFF00]/30",
      text: "已发放",
    },
    cancelled: {
      icon: XCircle,
      color: "#ee675c",
      bgColor: "bg-[#ee675c]/10",
      borderColor: "border-[#ee675c]/30",
      text: "已取消",
    },
    refunded: {
      icon: XCircle,
      color: "#9aa0a6",
      bgColor: "bg-[#9aa0a6]/10",
      borderColor: "border-[#9aa0a6]/30",
      text: "已退款",
    },
  }

  const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen bg-[#131314] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 返回按钮 */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-[14px] text-[#9aa0a6] hover:text-[#e3e3e3] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        {/* 支付处理中提示 */}
        {order.status === "pending" && polling && (
          <div className="bg-[#fdd663]/10 border border-[#fdd663]/30 rounded-xl p-4 mb-6 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-[#fdd663] animate-spin" />
            <p className="text-[14px] text-[#fdd663]">
              正在检查支付状态，请稍候...
            </p>
          </div>
        )}

        {/* 待支付但不在轮询状态 */}
        {order.status === "pending" && !polling && tradeNo && (
          <div className="bg-[#fdd663]/10 border border-[#fdd663]/30 rounded-xl p-4 mb-6">
            <p className="text-[14px] text-[#fdd663]">
              如果已完成支付，请点击下方按钮刷新状态
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-[#fdd663] text-[#131314] rounded-lg text-[13px] font-semibold hover:bg-[#fdd663]/80 transition-colors"
            >
              刷新订单状态
            </button>
          </div>
        )}

        {/* 订单信息卡片 - 可复制区域 */}
        <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] overflow-hidden mb-6 selectable">
          {/* 状态栏 */}
          <div className={`px-6 py-4 ${status.bgColor} border-b ${status.borderColor} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <StatusIcon className="w-5 h-5" style={{ color: status.color }} />
              <span className="text-[15px] font-semibold" style={{ color: status.color }}>{status.text}</span>
            </div>
            <span className="text-[13px] text-[#9aa0a6]">
              {new Date(order.created_at).toLocaleString("zh-CN")}
            </span>
          </div>
          
          {/* 订单详情 */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 text-[14px]">
              <div>
                <span className="text-[#6e6e73]">订单号</span>
                <p className="mt-1 font-mono text-[#e3e3e3]">{order.order_no}</p>
              </div>
              <div>
                <span className="text-[#6e6e73]">购买产品</span>
                <p className="mt-1 text-[#e3e3e3]">{order.product_name}</p>
              </div>
              <div>
                <span className="text-[#6e6e73]">购买数量</span>
                <p className="mt-1 text-[#e3e3e3]">{order.quantity} 件</p>
              </div>
              <div>
                <span className="text-[#6e6e73]">单价</span>
                <p className="mt-1 text-[#e3e3e3]">¥{order.unit_price}</p>
              </div>
            </div>
            
            {/* 总计 */}
            <div className="mt-6 pt-4 border-t border-[#3c3c3f] flex items-center justify-between">
              <span className="text-[15px] text-[#9aa0a6]">订单总计</span>
              <span className="text-[22px] font-bold text-[#7CFF00]">¥{order.total_amount}</span>
            </div>
          </div>
        </div>

        {/* 查询密码输入区域 - 仅在需要验证且未验证时显示 */}
        {order.query_password && !passwordVerified && order.status === "delivered" && (
          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-[#3c3c3f]">
              <h2 className="text-[15px] font-semibold text-[#e3e3e3]">验证查询密码</h2>
              <p className="text-[13px] text-[#6e6e73] mt-1">请输入下单时设置的查询密码以查看账号信息</p>
            </div>
            <div className="p-6">
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
                    placeholder="请输入查询密码"
                    className="w-full h-11 px-4 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] placeholder-[#6e6e73] text-[14px] focus:outline-none focus:border-[#7CFF00] transition-colors"
                  />
                </div>
                <button
                  onClick={handleVerifyPassword}
                  disabled={verifying || !password.trim()}
                  className="h-11 px-6 bg-[#7CFF00] hover:bg-[#9FFF40] disabled:bg-[#3c3c3f] text-[#131314] disabled:text-[#6e6e73] font-semibold rounded-xl transition-colors flex items-center gap-2 shrink-0"
                >
                  {verifying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "验证"
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="mt-3 text-[13px] text-[#ee675c]">{passwordError}</p>
              )}
            </div>
          </div>
        )}

        {/* 账号信息 - 已发放且已验证密码（或无需密码）时显示 - 可复制区域 */}
        {order.status === "delivered" && order.delivered_content && passwordVerified && (
          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] overflow-hidden mb-6 selectable">
            <div className="px-6 py-4 border-b border-[#3c3c3f] flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-[#e3e3e3]">账号信息</h2>
              <CopyButton content={order.delivered_content} />
            </div>
            <div className="p-6">
              <div className="bg-[#252627] rounded-xl p-4 font-mono text-[13px] text-[#81c995] whitespace-pre-wrap break-all leading-relaxed">
                {order.delivered_content}
              </div>
              {order.delivered_at && (
                <p className="mt-4 text-[12px] text-[#6e6e73]">
                  发放时间: {new Date(order.delivered_at).toLocaleString("zh-CN")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 使用说明 - 已发放且已验证密码时显示 - 可复制区域 */}
        {order.status === "delivered" && order.usage_instructions && passwordVerified && (
          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] overflow-hidden selectable">
            <div className="px-6 py-4 border-b border-[#3c3c3f]">
              <h2 className="text-[15px] font-semibold text-[#e3e3e3]">使用说明</h2>
            </div>
            <div className="p-6">
              <div 
                className="prose prose-invert prose-sm max-w-none text-[#e3e3e3] [&_img]:rounded-xl [&_img]:max-w-full [&_img]:h-auto [&_a]:text-[#7CFF00] [&_a:hover]:underline"
                dangerouslySetInnerHTML={{ __html: order.usage_instructions }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 使用 Suspense 包裹以支持 useSearchParams
export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#131314] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7CFF00]" />
      </div>
    }>
      <OrderContent />
    </Suspense>
  )
}
