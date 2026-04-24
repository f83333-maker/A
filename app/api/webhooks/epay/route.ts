import { verifyEpaySign } from "@/lib/epay"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

async function handleWebhook(data: Record<string, any>) {
  console.log("[v0] 易支付回调数据:", data)

  // 验证签名
  if (!verifyEpaySign(data)) {
    console.error("[v0] 易支付签名验证失败")
    return NextResponse.json({ status: "fail", msg: "签名验证失败" })
  }

  // 获取订单号和状态 - 易支付返回的是 trade_status 字段，值为 TRADE_SUCCESS
  const orderNo = data.out_trade_no
  const tradeStatus = data.trade_status
  const tradeNo = data.trade_no

  console.log("[v0] 支付状态:", tradeStatus, "订单号:", orderNo, "交易号:", tradeNo)

  if (!orderNo) {
    return NextResponse.json({ status: "fail", msg: "缺少订单号" })
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
    return NextResponse.json({ status: "fail", msg: "订单不存在" })
  }

  // 根据支付状态处理 - 易支付成功状态是 TRADE_SUCCESS
  if (tradeStatus === "TRADE_SUCCESS") {
    console.log("[v0] 订单支付成功:", orderNo)

    // 检查订单是否已经处理过（防止重复发货）
    if (order.status === "delivered" || order.status === "paid") {
      console.log("[v0] 订单已处理过，跳过:", orderNo)
      return NextResponse.json({ status: "ok" })
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
    } else {
      console.log("[v0] 订单状态已更新为 delivered")
    }

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
  } else {
    console.log("[v0] 订单其他状态:", tradeStatus, orderNo)
  }

  // 返回成功响应
  return NextResponse.json({ status: "ok" })
}

// POST 请求处理（异步回调）
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const data: Record<string, any> = {}
    params.forEach((value, key) => {
      data[key] = value
    })
    return handleWebhook(data)
  } catch (error) {
    console.error("[v0] POST 易支付回调错误:", error)
    return NextResponse.json({ status: "fail", msg: "处理失败" }, { status: 500 })
  }
}

// GET 请求处理（同步回调）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const data: Record<string, any> = {}
    searchParams.forEach((value, key) => {
      data[key] = value
    })
    return handleWebhook(data)
  } catch (error) {
    console.error("[v0] GET 易支付回调错误:", error)
    return NextResponse.json({ status: "fail", msg: "处理失败" }, { status: 500 })
  }
}
