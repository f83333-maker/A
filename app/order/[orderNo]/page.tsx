"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Clock, Package, ArrowLeft, Lock, Loader2, Eye, EyeOff, RefreshCw } from "lucide-react"
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
  const [showPassword, setShowPassword] = useState(false)
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
        <Loader2 className="w-8 h-8 animate-spin text-[#8ab4f8]" />
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
          <Link href="/" className="text-[#8ab4f8] hover:underline">返回首页</Link>
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
      description: "订单已创建，等待支付完成",
    },
    paid: {
      icon: CheckCircle,
      color: "#81c995",
      bgColor: "bg-[#81c995]/10",
      borderColor: "border-[#81c995]/30",
      text: "已支付",
      description: "支付成功，账号正在处理中",
    },
    delivered: {
      icon: Package,
      color: "#8ab4f8",
      bgColor: "bg-[#8ab4f8]/10",
      borderColor: "border-[#8ab4f8]/30",
      text: "已发放",
      description: "账号已发放，请查收",
    },
    cancelled: {
      icon: XCircle,
      color: "#ee675c",
      bgColor: "bg-[#ee675c]/10",
      borderColor: "border-[#ee675c]/30",
      text: "已取消",
      description: "订单已取消",
    },
    refunded: {
      icon: XCircle,
      color: "#9aa0a6",
      bgColor: "bg-[#9aa0a6]/10",
      borderColor: "border-[#9aa0a6]/30",
      text: "已退款",
      description: "订单已退款",
    },
  }

  const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = status.icon

  // 需要密码验证但还未验证
  if (order.query_password && !passwordVerified) {
    return (
      <div className="min-h-screen bg-[#131314] py-8 px-4">
        <div className="max-w-md mx-auto">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-[14px] text-[#9aa0a6] hover:text-[#e3e3e3] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>

          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#8ab4f8]/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-[#8ab4f8]" />
              </div>
              <h1 className="text-xl font-semibold text-[#e3e3e3] mb-2">验证查询密码</h1>
              <p className="text-[14px] text-[#9aa0a6]">请输入下单时设置的查询密码</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
                  placeholder="请输入查询密码"
                  className="w-full h-12 px-4 pr-12 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[#e3e3e3] placeholder-[#6e6e73] text-[14px] focus:outline-none focus:border-[#8ab4f8] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9aa0a6] hover:text-[#e3e3e3]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {passwordError && (
                <p className="text-[13px] text-[#ee675c]">{passwordError}</p>
              )}

              <button
                onClick={handleVerifyPassword}
                disabled={verifying || !password.trim()}
                className="w-full h-12 bg-[#8ab4f8] hover:bg-[#aecbfa] disabled:bg-[#3c3c3f] text-[#131314] disabled:text-[#6e6e73] font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    验证中...
                  </>
                ) : (
                  "验证密码"
                )}
              </button>
            </div>

            <p className="mt-6 text-center text-[12px] text-[#6e6e73]">
              订单号: {order.order_no}
            </p>
          </div>
        </div>
      </div>
    )
  }

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

        {/* 状态卡片 */}
        <div className={`${status.bgColor} ${status.borderColor} border rounded-2xl p-6 mb-6`}>
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${status.color}20` }}
            >
              <StatusIcon className="w-7 h-7" style={{ color: status.color }} />
            </div>
            <div>
              <h1 className="text-[20px] font-semibold text-[#e3e3e3]">{status.text}</h1>
              <p className="text-[14px] text-[#9aa0a6] mt-1">{status.description}</p>
            </div>
          </div>
        </div>

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

        {/* 订单信息 */}
        <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-[#3c3c3f]">
            <h2 className="text-[16px] font-semibold text-[#e3e3e3]">订单信息</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-[14px] text-[#9aa0a6]">订单号</span>
              <span className="text-[14px] font-mono text-[#e3e3e3]">{order.order_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[14px] text-[#9aa0a6]">产品名称</span>
              <span className="text-[14px] text-[#e3e3e3]">{order.product_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[14px] text-[#9aa0a6]">购买数量</span>
              <span className="text-[14px] text-[#e3e3e3]">{order.quantity} 件</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[14px] text-[#9aa0a6]">单价</span>
              <span className="text-[14px] text-[#e3e3e3]">¥{order.unit_price}</span>
            </div>
            <div className="flex justify-between pt-4 border-t border-[#3c3c3f]">
              <span className="text-[16px] font-medium text-[#e3e3e3]">总计</span>
              <span className="text-[20px] font-bold text-[#8ab4f8]">¥{order.total_amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[14px] text-[#9aa0a6]">创建时间</span>
              <span className="text-[14px] text-[#e3e3e3]">
                {new Date(order.created_at).toLocaleString("zh-CN")}
              </span>
            </div>
          </div>
        </div>

        {/* 账号信息（已发放时显示） */}
        {order.status === "delivered" && order.delivered_content && (
          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-[#3c3c3f] flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-[#e3e3e3]">账号信息</h2>
              <CopyButton content={order.delivered_content} />
            </div>
            <div className="p-6">
              <div className="bg-[#2d2e30] rounded-xl p-4 font-mono text-[13px] text-[#81c995] whitespace-pre-wrap break-all">
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

        {/* 使用说明（如果有的话） */}
        {order.status === "delivered" && order.usage_instructions && (
          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#3c3c3f]">
              <h2 className="text-[16px] font-semibold text-[#e3e3e3]">使用说明</h2>
            </div>
            <div className="p-6">
              <div 
                className="prose prose-invert prose-sm max-w-none text-[#e3e3e3] [&_img]:rounded-xl [&_img]:max-w-full [&_img]:h-auto [&_a]:text-[#8ab4f8] [&_a:hover]:underline"
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
        <Loader2 className="w-8 h-8 animate-spin text-[#8ab4f8]" />
      </div>
    }>
      <OrderContent />
    </Suspense>
  )
}
