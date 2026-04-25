"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Copy, AlertCircle, Loader2 } from "lucide-react"

interface OrderData {
  order_no: string
  product_name: string
  quantity: number
  total_amount: number
  status: string
  buyer_email: string
  buyer_name: string
  created_at: string
}

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const token = searchParams.token

  useEffect(() => {
    if (!token) {
      setError("缺少订单令牌")
      setLoading(false)
      return
    }

    // 获取订单信息
    fetch(`/api/orders/by-token?token=${token}`)
      .then(res => {
        if (!res.ok) {
          throw new Error("订单查询失败或已过期")
        }
        return res.json()
      })
      .then(data => {
        setOrder(data)
      })
      .catch(err => {
        setError(err.message || "获取订单信息失败")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token])

  const copyOrderNo = () => {
    if (order?.order_no) {
      navigator.clipboard.writeText(order.order_no)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f1419] to-[#1a1d23] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#8ab4f8] animate-spin mx-auto mb-4" />
          <p className="text-[#e3e3e3]">加载订单信息中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f1419] to-[#1a1d23] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-[#2d2e30] border border-[#ef5350] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-[#ef5350]" />
              <h2 className="text-[#e3e3e3] font-semibold">查询失败</h2>
            </div>
            <p className="text-[#9aa0a6] mb-6">{error}</p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-[#8ab4f8] text-[#0f1419] rounded-lg font-medium hover:bg-[#6fa3e6] transition-colors"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f1419] to-[#1a1d23] flex items-center justify-center">
        <p className="text-[#e3e3e3]">未找到订单信息</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1419] to-[#1a1d23] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 成功提示 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#4caf50] rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#e3e3e3] mb-2">支付成功</h1>
          <p className="text-[#9aa0a6]">感谢您的购买，订单已确认</p>
        </div>

        {/* 订单信息卡片 */}
        <div className="bg-[#2d2e30] border border-[#3c3c3f] rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-[#e3e3e3] mb-6">订单详情</h2>

          <div className="space-y-6">
            {/* 订单号 */}
            <div>
              <label className="text-[#9aa0a6] text-sm font-medium block mb-2">
                订单号
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[#1a1d23] border border-[#3c3c3f] rounded-lg px-4 py-3 text-[#8ab4f8] font-mono text-sm break-all">
                  {order.order_no}
                </code>
                <button
                  onClick={copyOrderNo}
                  className="px-4 py-3 bg-[#8ab4f8] text-[#0f1419] rounded-lg font-medium hover:bg-[#6fa3e6] transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? "已复制" : "复制"}
                </button>
              </div>
            </div>

            {/* 产品信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#9aa0a6] text-sm font-medium block mb-2">
                  产品名称
                </label>
                <p className="text-[#e3e3e3]">{order.product_name}</p>
              </div>
              <div>
                <label className="text-[#9aa0a6] text-sm font-medium block mb-2">
                  购买数量
                </label>
                <p className="text-[#e3e3e3]">{order.quantity}</p>
              </div>
            </div>

            {/* 买家信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#9aa0a6] text-sm font-medium block mb-2">
                  买家姓名
                </label>
                <p className="text-[#e3e3e3]">{order.buyer_name}</p>
              </div>
              <div>
                <label className="text-[#9aa0a6] text-sm font-medium block mb-2">
                  邮箱
                </label>
                <p className="text-[#e3e3e3]">{order.buyer_email}</p>
              </div>
            </div>

            {/* 金额 */}
            <div>
              <label className="text-[#9aa0a6] text-sm font-medium block mb-2">
                总金额
              </label>
              <p className="text-2xl font-bold text-[#8ab4f8]">
                ¥{order.total_amount.toFixed(2)}
              </p>
            </div>

            {/* 订单状态 */}
            <div>
              <label className="text-[#9aa0a6] text-sm font-medium block mb-2">
                订单状态
              </label>
              <span className="inline-block px-3 py-1 bg-[#4caf50] text-white rounded-full text-sm font-medium">
                {order.status === "delivered" ? "已发货" : "处理中"}
              </span>
            </div>

            {/* 创建时间 */}
            <div>
              <label className="text-[#9aa0a6] text-sm font-medium block mb-2">
                订单时间
              </label>
              <p className="text-[#e3e3e3]">
                {new Date(order.created_at).toLocaleString("zh-CN")}
              </p>
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="bg-[#1a2332] border border-[#3c5a8f] rounded-xl p-4 mb-8">
          <p className="text-[#8ab4f8] text-sm">
            💡 请妥善保管您的订单号，如需查询订单可通过订单查询页面使用此订单号和订单密码查询。
          </p>
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-4">
          <Link
            href="/"
            className="flex-1 px-6 py-3 bg-[#8ab4f8] text-[#0f1419] rounded-lg font-medium hover:bg-[#6fa3e6] transition-colors text-center"
          >
            返回首页
          </Link>
          <Link
            href="/order-query"
            className="flex-1 px-6 py-3 bg-[#2d2e30] text-[#8ab4f8] border border-[#8ab4f8] rounded-lg font-medium hover:bg-[#3c3c3f] transition-colors text-center"
          >
            查询订单
          </Link>
        </div>
      </div>
    </div>
  )
}
