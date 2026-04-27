import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const orderNo = searchParams.get("orderNo")
  const contact = searchParams.get("contact")

  // 至少需要一个查询条件
  if (!orderNo && !contact) {
    return NextResponse.json({ success: false, error: "请输入订单号或联系方式" })
  }

  try {
    const supabase = await createClient()
    const fields = "id, order_no, product_name, quantity, unit_price, total_amount, status, created_at, buyer_email, buyer_name, query_password"

    if (orderNo && orderNo.trim()) {
      // 订单号精确查询（同时兼容商户单号和易支付单号）
      const no = orderNo.trim()
      let { data: order, error } = await supabase
        .from("orders")
        .select(fields)
        .eq("order_no", no)
        .single()

      if (error || !order) {
        // 尝试通过易支付单号查询
        const { data: orderByTrade } = await supabase
          .from("orders")
          .select(fields)
          .or(`stripe_payment_intent_id.eq.${no},epay_trade_no.eq.${no}`)
          .single()
        order = orderByTrade
      }

      if (!order) {
        return NextResponse.json({ success: false, error: "未找到该订单，请检查订单号是否正确" })
      }

      return NextResponse.json({
        success: true,
        order: {
          ...order,
          query_password: order.query_password ? "***" : null,
          buyer_email: order.buyer_email ? maskContact(order.buyer_email) : null,
        }
      })
    }

    if (contact && contact.trim()) {
      // 联系方式模糊匹配（邮箱、手机、QQ）
      const c = contact.trim()
      const { data: orders, error } = await supabase
        .from("orders")
        .select(fields)
        .or(`buyer_email.ilike.%${c}%,buyer_name.ilike.%${c}%`)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("订单查询错误:", error)
        return NextResponse.json({ success: false, error: "查询失败，请稍后重试" })
      }

      if (!orders || orders.length === 0) {
        return NextResponse.json({ success: false, error: "未找到相关订单，请确认联系方式是否与下单时一致" })
      }

      const safeOrders = orders.map(o => ({
        ...o,
        query_password: o.query_password ? "***" : null,
        buyer_email: o.buyer_email ? maskContact(o.buyer_email) : null,
      }))

      // 只有一个结果直接返回单条
      if (safeOrders.length === 1) {
        return NextResponse.json({ success: true, order: safeOrders[0] })
      }

      return NextResponse.json({ success: true, orders: safeOrders })
    }

    return NextResponse.json({ success: false, error: "查询失败，请稍后重试" })
  } catch {
    return NextResponse.json({ success: false, error: "查询失败，请稍后重试" })
  }
}

// 脱敏联系方式
function maskContact(contact: string): string {
  if (contact.includes("@")) {
    // 邮箱脱敏
    const [user, domain] = contact.split("@")
    return user.length > 2 
      ? `${user.slice(0, 2)}***@${domain}`
      : `${user[0]}***@${domain}`
  }
  // 手机/QQ脱敏
  if (contact.length > 4) {
    return `${contact.slice(0, 2)}****${contact.slice(-2)}`
  }
  return "***"
}
