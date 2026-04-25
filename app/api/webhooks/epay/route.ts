import { verifyEpaySign } from "@/lib/epay"
import { createClient } from "@/lib/supabase/server"
import { generateOrderToken } from "@/lib/order-token"
import { NextRequest, NextResponse } from "next/server"

// 生产域名
const PRODUCTION_URL = "https://pcccc.cc"

async function processPayment(data: Record<string, any>): Promise<{ success: boolean; token?: string }> {
  console.log("[v0] 易支付回调数据:", JSON.stringify(data))

  // 验证签名
  if (!verifyEpaySign(data)) {
    console.error("[v0] 易支付签名验证失败")
    return { success: false }
  }

  // 获取订单号和状态
  const orderNo = data.out_trade_no
  const tradeStatus = data.trade_status
  const tradeNo = data.trade_no

  console.log("[v0] 支付状态:", tradeStatus, "订单号:", orderNo, "交易号:", tradeNo)

  if (!orderNo) {
    console.error("[v0] 缺少订单号")
    return { success: false }
  }

  // 只处理支付成功的通知
  if (tradeStatus !== "TRADE_SUCCESS") {
    console.log("[v0] 非成功状态，跳过处理:", tradeStatus)
    return { success: true } // 返回成功避免重试
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
    return { success: false }
  }

  // 检查订单是否已经处理过（防止重复发货）
  if (order.status === "delivered" || order.status === "paid") {
    console.log("[v0] 订单已处理过，获取已有token:", orderNo)
    // 获取已存在的 token 或生成新的
    try {
      console.log("[v0] 为已处理订单生成 token:", order.id)
      const token = await generateOrderToken(order.id)
      console.log("[v0] 获取/生成成功，token:", token.substring(0, 10) + "...")
      return { success: true, token }
    } catch (error) {
      console.error("[v0] 获取订单 token 失败:", error)
      return { success: true }
    }
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
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "delivered",
      stripe_payment_intent_id: tradeNo,
      delivered_content: deliveredContent,
      delivered_at: new Date().toISOString(),
    })
    .eq("order_no", orderNo)

  if (updateError) {
    console.error("[v0] 更新订单状态失败:", updateError)
    return { success: false }
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

  // 生成安全的订单查询 token
  try {
    console.log("[v0] 为订单生成 token:", order.id)
    const token = await generateOrderToken(order.id)
    console.log("[v0] 生成成功，token:", token.substring(0, 10) + "...")
    return { success: true, token }
  } catch (error) {
    console.error("[v0] 生成订单 token 失败:", error)
    return { success: true, token: null } // token 生成失败但订单处理成功
  }
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
    
    const result = await processPayment(data)
    
    // 易支付要求返回纯文本 "success"
    return new NextResponse(result.success ? "success" : "fail", {
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
    const result = await processPayment(data)
    
    // 获取订单号
    const orderNo = data.out_trade_no
    if (orderNo && result.token) {
      // 使用加密 token 重定向到安全地址
      return NextResponse.redirect(`${PRODUCTION_URL}/order-success?token=${result.token}`)
    }
    
    // 如果没有 token 但订单处理成功，用订单号重定向
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
