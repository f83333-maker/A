import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { CheckCircle, XCircle, Clock, Package, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CopyButton } from "@/components/copy-button"

interface OrderPageProps {
  params: Promise<{ orderNo: string }>
  searchParams: Promise<{ success?: string; cancelled?: string }>
}

async function getOrder(orderNo: string) {
  const supabase = await createClient()
  
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_no", orderNo)
    .single()
  
  return order
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const { orderNo } = await params
  const { success, cancelled } = await searchParams
  
  const order = await getOrder(orderNo)
  
  if (!order) {
    notFound()
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

        {/* 刚支付成功的提示 */}
        {success === "true" && order.status === "pending" && (
          <div className="bg-[#fdd663]/10 border border-[#fdd663]/30 rounded-xl p-4 mb-6">
            <p className="text-[14px] text-[#fdd663]">
              支付正在处理中，请稍后刷新页面查看订单状态...
            </p>
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
              <span className="text-[14px] text-[#e3e3e3]">${order.unit_price}</span>
            </div>
            <div className="flex justify-between pt-4 border-t border-[#3c3c3f]">
              <span className="text-[16px] font-medium text-[#e3e3e3]">总计</span>
              <span className="text-[20px] font-bold text-[#8ab4f8]">${order.total_amount}</span>
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
          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#3c3c3f] flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-[#e3e3e3]">账号信息</h2>
              <CopyButton content={order.delivered_content} />
            </div>
            <div className="p-6">
              <div className="bg-[#2d2e30] rounded-xl p-4 font-mono text-[13px] text-[#81c995] whitespace-pre-wrap break-all">
                {order.delivered_content}
              </div>
              <p className="mt-4 text-[12px] text-[#6e6e73]">
                发放时间: {new Date(order.delivered_at).toLocaleString("zh-CN")}
              </p>
            </div>
          </div>
        )}

        {/* 取消提示 */}
        {cancelled === "true" && (
          <div className="mt-6 text-center">
            <p className="text-[14px] text-[#9aa0a6]">
              支付已取消。
              <Link href="/" className="text-[#8ab4f8] hover:underline ml-1">
                返回继续购物
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}


