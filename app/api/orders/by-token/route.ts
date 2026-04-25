import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")
    
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // 获取 token 记录
    const { data: tokenData, error: tokenError } = await supabase
      .from("order_tokens")
      .select("order_id, expires_at")
      .eq("token", token)
      .single()
    
    if (tokenError || !tokenData) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 })
    }
    
    // 检查 token 是否过期
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 410 })
    }
    
    // 获取订单详情
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", tokenData.order_id)
      .single()
    
    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    
    return NextResponse.json({
      order_no: order.order_no,
      product_name: order.product_name,
      quantity: order.quantity,
      total_amount: order.total_amount,
      status: order.status,
      buyer_email: order.buyer_email,
      buyer_name: order.buyer_name,
      created_at: order.created_at,
    })
  } catch (error) {
    console.error("Error in /api/orders/by-token:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
