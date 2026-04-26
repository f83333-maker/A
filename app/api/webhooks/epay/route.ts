import { verifyEpaySign } from "@/lib/epay"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// 生产域名
const PRODUCTION_URL = "https://www.pcccc.cc"

async function processPayment(data: Record<string, any>): Promise<boolean> {
  console.log("[v0] 易支付回调数据:", JSON.stringify(data))

  // 验证签名（异步）
  const signValid = await verifyEpaySign(data)
  if (!signValid) {
    console.error("[v0] 易支付签名验证失败")
    return false
  }

  // 获取订单号和状态
  const orderNo = data.out_trade_no
  const tradeStatus = data.trade_status
  const tradeNo = data.trade_no

  console.log("[v0] 支付状态:", tradeStatus, "订单号:", orderNo, "交易号:", tradeNo)

  if (!orderNo) {
    console.error("[v0] 缺少订单号")
    return false
  }

  // 只处理支付成功的通知
  if (tradeStatus !== "TRADE_SUCCESS") {
    console.log("[v0] 非成功状态，跳过处理:", tradeStatus)
    return true // 返回成功避免重试
  }

  const supabase = await createClient()

  // 检查订单是否存在
  const { data: order, error: queryError } = await supabase
    .from("orders")
    .select("*")
    .eq("order_no", orderNo)
    .single()

  if (queryError || !order) {
    console.error("[v0] 订单不存在:", orderNo)
    return false
  }

  // 检查订单是否已经处理过（防止重复发货）
  if (order.status === "delivered" || order.status === "paid") {
    console.log("[v0] 订单已处理过，跳过:", orderNo)
    return true
  }

  // 从库存表获取可用的账号
  const { data: inventoryItems, error: invError } = await supabase
    .from("inventory")
    .select("*")
    .eq("product_id", order.product_id)
    .eq("status", "available")
    .limit(order.quantity)

  if (invError) {
    console.error("[v0] 获取库存失败:", invError)
  }

  let deliveredContent = ""
  
  if (inventoryItems && inventoryItems.length > 0) {
    // 从库存表取货
    const deliveredIds = inventoryItems.map(item => item.id)
    const deliveredAccounts = inventoryItems.map(item => item.content)
    deliveredContent = deliveredAccounts.join("\n")

    // 更新库存状态为已售出
    await supabase
      .from("inventory")
      .update({
        status: "sold",
        order_id: order.id,
        sold_at: new Date().toISOString(),
      })
      .in("id", deliveredIds)

    console.log(`[v0] 从库存发货 ${deliveredIds.length} 件`)
  } else {
    deliveredContent = "库存不足，请联系客服处理"
    console.log("[v0] 库存不足，订单:", orderNo)
  }

  // 更新订单状态为已发货
  // 记录三个单号：
  // 1. order_no - 商户订单号（本站ZH开头，已有）
  // 2. epay_trade_no / stripe_payment_intent_id - 易支付系统订单号
  // 3. user_trade_no - 用户交易单号（如微信/支付宝的实际交易流水号，如果易支付返回）
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "delivered",
      stripe_payment_intent_id: tradeNo, // 易支付系统订单号
      epay_trade_no: tradeNo, // 新字段（如果存在）
      delivered_content: deliveredContent,
      delivered_at: new Date().toISOString(),
    })
    .eq("order_no", orderNo)

  if (updateError) {
    console.error("[v0] 更新订单状态失败:", updateError)
    return false
  }

  console.log("[v0] 订单状态已更新为 delivered")

  // 更新产品库存和销量
  const { count: availableCount } = await supabase
    .from("inventory")
    .select("*", { count: "exact", head: true })
    .eq("product_id", order.product_id)
    .eq("status", "available")

  const { data: product } = await supabase
    .from("products")
    .select("sales")
    .eq("id", order.product_id)
    .single()

  await supabase
    .from("products")
    .update({
      stock: availableCount || 0,
      sales: (product?.sales || 0) + order.quantity,
    })
    .eq("id", order.product_id)

  console.log(`[v0] 订单 ${orderNo} 已完成并发放账号`)
  return true
}

// POST 请求处理（异步回调 notify_url）
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    console.log("[v0] POST 原始数据:", body)
    
    const params = new URLSearchParams(body)
    const data: Record<string, any> = {}
    params.forEach((value, key) => {
      data[key] = value
    })
    
    const success = await processPayment(data)
    
    // 易支付要求返回纯文本 "success"
    return new NextResponse(success ? "success" : "fail", {
      headers: { "Content-Type": "text/plain" }
    })
  } catch (error) {
    console.error("[v0] POST 易支付回调错误:", error)
    return new NextResponse("fail", {
      headers: { "Content-Type": "text/plain" }
    })
  }
}

// GET 请求处理（同步跳转 return_url）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const data: Record<string, any> = {}
    searchParams.forEach((value, key) => {
      data[key] = value
    })
    
    console.log("[v0] GET 同步回调数据:", JSON.stringify(data))
    
    // 同步回调也处理支付状态
    await processPayment(data)
    
    // 获取订单号并跳转到订单详情页
    const orderNo = data.out_trade_no
    if (orderNo) {
      return NextResponse.redirect(`${PRODUCTION_URL}/order/${orderNo}?trade_no=${data.trade_no || ""}`)
    }
    
    // 无订单号则跳转首页
    return NextResponse.redirect(PRODUCTION_URL)
  } catch (error) {
    console.error("[v0] GET 易支付回调错误:", error)
    return NextResponse.redirect(PRODUCTION_URL)
  }
}
