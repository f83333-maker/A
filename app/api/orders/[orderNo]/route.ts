import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  const { orderNo } = await params
  const supabase = await createClient()

  // 支持通过三种单号查询：
  // 1. order_no - 商户订单号（ZH开头）
  // 2. stripe_payment_intent_id - 易支付系统订单号
  // 3. epay_trade_no - 易支付系统订单号（新字段）
  
  // 先尝试通过商户订单号查询
  let { data: order, error } = await supabase
    .from("orders")
    .select("id, order_no, product_id, product_name, quantity, unit_price, total_amount, status, delivered_content, delivered_at, created_at, query_password, stripe_payment_intent_id, epay_trade_no")
    .eq("order_no", orderNo)
    .single()

  // 如果没找到，尝试通过易支付订单号查询
  if (error || !order) {
    const { data: orderByTrade, error: tradeError } = await supabase
      .from("orders")
      .select("id, order_no, product_id, product_name, quantity, unit_price, total_amount, status, delivered_content, delivered_at, created_at, query_password, stripe_payment_intent_id, epay_trade_no")
      .or(`stripe_payment_intent_id.eq.${orderNo},epay_trade_no.eq.${orderNo}`)
      .single()
    
    if (!tradeError && orderByTrade) {
      order = orderByTrade
      error = null
    }
  }

  if (error || !order) {
    return NextResponse.json({ error: "订单不存在，请检查订单号是否正确" }, { status: 404 })
  }

  // 获取产品的使用说明
  let usageInstructions = null
  if (order.product_id) {
    const { data: product } = await supabase
      .from("products")
      .select("usage_instructions")
      .eq("id", order.product_id)
      .single()
    usageInstructions = product?.usage_instructions || null
  }

  // 返回订单信息（只返回是否有密码，不返回密码本身）
  return NextResponse.json({
    order: {
      ...order,
      query_password: order.query_password ? "***" : null, // 隐藏实际密码
      // 如果未验证密码，隐藏敏感内容
      delivered_content: order.query_password ? null : order.delivered_content,
      usage_instructions: usageInstructions,
    }
  })
}
