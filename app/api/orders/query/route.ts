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
    
    let query = supabase
      .from("orders")
      .select("id, order_no, product_name, quantity, unit_price, total_amount, status, created_at, buyer_email, buyer_name, query_password")
      .order("created_at", { ascending: false })

    // 优先使用订单号精确查询
    if (orderNo && orderNo.trim()) {
      query = query.eq("order_no", orderNo.trim())
    } else if (contact && contact.trim()) {
      // 使用联系方式模糊匹配（邮箱或姓名）
      query = query.or(`buyer_email.ilike.%${contact.trim()}%,buyer_name.ilike.%${contact.trim()}%`)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error("订单查询错误:", error)
      return NextResponse.json({ success: false, error: "查询失败，请稍后重试" })
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: false, error: "未找到相关订单" })
    }

    // 隐藏敏感信息
    const safeOrders = orders.map(order => ({
      ...order,
      query_password: order.query_password ? "***" : null,
      buyer_email: order.buyer_email ? maskContact(order.buyer_email) : null,
    }))

    // 如果是订单号查询，返回单个订单；如果是联系方式查询，返回订单列表
    if (orderNo && orderNo.trim()) {
      return NextResponse.json({ success: true, order: safeOrders[0] })
    }
    
    return NextResponse.json({ success: true, orders: safeOrders })
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
