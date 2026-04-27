"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import useSWR from "swr"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"

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
  buyer_phone: string
  delivered_content: string
  delivered_at: string
  created_at: string
  updated_at: string
  stripe_payment_intent_id: string | null
  epay_trade_no: string | null
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch order")
  return res.json()
})

const statusConfig: Record<string, { color: string; text: string }> = {
  pending: { color: "#fdd663", text: "待支付" },
  paid: { color: "#81c995", text: "已支付" },
  delivered: { color: "#7CFF00", text: "已发放" },
  cancelled: { color: "#ee675c", text: "已取消" },
  refunded: { color: "#9aa0a6", text: "已退款" },
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  
  const { data: order, isLoading, error } = useSWR<Order>(
    orderId ? `/api/admin/orders/${orderId}` : null,
    fetcher
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#7CFF00]" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#7CFF00] hover:text-[#9FFF40] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle className="w-12 h-12 text-[#ee675c]" />
          <p className="text-[14px] text-[#e3e3e3] font-medium">订单不存在或加载失败</p>
        </div>
      </div>
    )
  }

  const status = statusConfig[order.status] || statusConfig.pending

  return (
    <div className="space-y-4">
      {/* 返回按钮 */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[#7CFF00] hover:text-[#9FFF40] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      {/* 页面标题 */}
      <div>
        <h1 className="text-[22px] font-semibold text-[#e3e3e3]">订单详情</h1>
        <p className="text-[13px] text-[#9aa0a6] mt-0.5">订单号: {order.order_no}</p>
      </div>

      {/* 主要内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：订单信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 订单基本信息 */}
          <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] p-6">
            <h2 className="text-[16px] font-semibold text-[#e3e3e3] mb-4">基本信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[12px] text-[#6e6e73]">订单号</span>
                <p className="text-[14px] font-mono text-[#e3e3e3] mt-1">{order.order_no}</p>
              </div>
              <div>
                <span className="text-[12px] text-[#6e6e73]">订单状态</span>
                <div className="mt-1">
                  <span
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-[12px] font-medium"
                    style={{
                      backgroundColor: `${status.color}15`,
                      color: status.color,
                    }}
                  >
                    {status.text}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[12px] text-[#6e6e73]">创建时间</span>
                <p className="text-[14px] text-[#e3e3e3] mt-1">
                  {new Date(order.created_at).toLocaleString("zh-CN")}
                </p>
              </div>
              <div>
                <span className="text-[12px] text-[#6e6e73]">最后更新</span>
                <p className="text-[14px] text-[#e3e3e3] mt-1">
                  {new Date(order.updated_at).toLocaleString("zh-CN")}
                </p>
              </div>
            </div>
          </div>

          {/* 商品信息 */}
          <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] p-6">
            <h2 className="text-[16px] font-semibold text-[#e3e3e3] mb-4">商品信息</h2>
            <div className="space-y-4">
              <div>
                <span className="text-[12px] text-[#6e6e73]">产品名称</span>
                <p className="text-[14px] text-[#e3e3e3] mt-1">{order.product_name}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-[12px] text-[#6e6e73]">数量</span>
                  <p className="text-[14px] text-[#e3e3e3] mt-1">{order.quantity}</p>
                </div>
                <div>
                  <span className="text-[12px] text-[#6e6e73]">单价</span>
                  <p className="text-[14px] text-[#e3e3e3] mt-1">¥{order.unit_price}</p>
                </div>
                <div>
                  <span className="text-[12px] text-[#6e6e73]">小计</span>
                  <p className="text-[14px] font-semibold text-[#7CFF00] mt-1">
                    ¥{(order.unit_price * order.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 买家信息 */}
          <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] p-6">
            <h2 className="text-[16px] font-semibold text-[#e3e3e3] mb-4">买家信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[12px] text-[#6e6e73]">买家名称</span>
                <p className="text-[14px] text-[#e3e3e3] mt-1">{order.buyer_name || "-"}</p>
              </div>
              <div>
                <span className="text-[12px] text-[#6e6e73]">邮箱</span>
                <p className="text-[14px] text-[#e3e3e3] mt-1 break-all">{order.buyer_email || "-"}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[12px] text-[#6e6e73]">电话</span>
                <p className="text-[14px] text-[#e3e3e3] mt-1">{order.buyer_phone || "-"}</p>
              </div>
            </div>
          </div>

          {/* 发放内容 */}
          {order.delivered_content && (
            <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] p-6">
              <h2 className="text-[16px] font-semibold text-[#e3e3e3] mb-4">发放内容</h2>
              <div className="bg-[#2d2e30] rounded-lg p-4">
                <p className="text-[14px] text-[#e3e3e3] whitespace-pre-wrap break-words">
                  {order.delivered_content}
                </p>
              </div>
              {order.delivered_at && (
                <p className="text-[12px] text-[#6e6e73] mt-3">
                  发放时间: {new Date(order.delivered_at).toLocaleString("zh-CN")}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 右侧：金额汇总 */}
        <div className="lg:col-span-1">
          <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] p-6 sticky top-4">
            <h2 className="text-[16px] font-semibold text-[#e3e3e3] mb-4">金额汇总</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[#9aa0a6]">单价</span>
                <span className="text-[#e3e3e3]">¥{order.unit_price}</span>
              </div>
              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[#9aa0a6]">数量</span>
                <span className="text-[#e3e3e3]">x{order.quantity}</span>
              </div>
              <div className="h-px bg-[#3c3c3f]" />
              <div className="flex items-center justify-between text-[16px] font-semibold">
                <span className="text-[#e3e3e3]">订单总额</span>
                <span className="text-[#7CFF00]">¥{order.total_amount}</span>
              </div>
            </div>

            {/* 支付信息 */}
            {order.stripe_payment_intent_id && (
              <div className="mt-6 pt-6 border-t border-[#3c3c3f]">
                <h3 className="text-[12px] font-semibold text-[#9aa0a6] mb-3">支付信息</h3>
                <div className="space-y-2 text-[13px]">
                  <div>
                    <span className="text-[#6e6e73] block mb-1">易支付订单号</span>
                    <span className="font-mono text-[#81c995] block break-all">
                      {order.stripe_payment_intent_id}
                    </span>
                  </div>
                  {order.epay_trade_no && order.epay_trade_no !== order.stripe_payment_intent_id && (
                    <div>
                      <span className="text-[#6e6e73] block mb-1">用户交易单号</span>
                      <span className="font-mono text-[#7CFF00] block break-all">
                        {order.epay_trade_no}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
