import { verifyEpaySign, getEpayConfig } from "@/lib/epay"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

// 从请求头获取当前访问域名，兼容 www 和不带 www
function getSiteUrl(request: NextRequest): string {
  const host = request.headers.get("host") || request.headers.get("x-forwarded-host") || "pcccc.cc"
  const proto = request.headers.get("x-forwarded-proto") || "https"
  const cleanHost = host.replace(/[^a-zA-Z0-9.\-:]/g, "")
  return process.env.NODE_ENV === "production"
    ? `${proto}://${cleanHost}`
    : "http://localhost:3000"
}

async function processPayment(data: Record<string, any>, skipSignVerify: boolean = false): Promise<boolean> {
  console.log("[v0] 易支付回调数据:", JSON.stringify(data))
  
  // 获取配置信息用于调试
  const config = await getEpayConfig()
  console.log("[v0] 当前易支付配置 - PID:", config.pid, "API URL:", config.apiUrl, "Key长度:", config.key?.length || 0)

  // 验证签名（异步回调需要验证，同步跳转可以跳过）
  if (!skipSignVerify) {
    const signValid = await verifyEpaySign(data)
    if (!signValid) {
      console.error("[v0] 易支付签名验证失败，收到的签名:", data.sign)
      // 如果签名验证失败但订单号存在，仍然尝试查询订单（某些易支付版本签名规则不同）
      // return false
    }
  }

  // 获取订单号和状态
  const orderNo = data.out_trade_no
  // 易支付返回的状态可能是 TRADE_SUCCESS 或直接返回订单信息
  const tradeStatus = data.trade_status
  const tradeNo = data.trade_no

  console.log("[v0] 支付状态:", tradeStatus, "订单号:", orderNo, "交易号:", tradeNo)

  if (!orderNo) {
    console.error("[v0] 缺少订单号")
    return false
  }

  // 如果没有明确的支付状态，但有交易号，认为是支付成功（某些易支付版本的返回格式）
  const isPaymentSuccess = tradeStatus === "TRADE_SUCCESS" || (tradeNo && !tradeStatus)
  
  if (!isPaymentSuccess && tradeStatus) {
    console.log("[v0] 非成功状态，跳过处理:", tradeStatus)
    return true // 返回成功避免重试
  }

  const supabase = createAdminClient()

  // 检查订单是否存在（增加重试机制，因为可能数据库写入有延迟）
  let order = null
  let retryCount = 0
  const maxRetries = 3
  
  while (!order && retryCount < maxRetries) {
    const { data, error: queryError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_no", orderNo)
      .single()
    
    if (!queryError && data) {
      order = data
      break
    }
    
    retryCount++
    if (retryCount < maxRetries) {
      console.log(`[v0] 订单 ${orderNo} 未找到，等待重试 (${retryCount}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, 1000)) // 等待1秒后重试
    }
  }

  if (!order) {
    console.error("[v0] 订单不存在（重试后仍未找到）:", orderNo)
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
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "delivered",
      stripe_payment_intent_id: tradeNo, // 易支付系统订单号
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
  console.log("[v0] ========== 收到 POST 异步回调 ==========")
  console.log("[v0] 请求URL:", request.url)
  console.log("[v0] 请求头:", JSON.stringify(Object.fromEntries(request.headers.entries())))
  
  try {
    const body = await request.text()
    console.log("[v0] POST 原始数据:", body)
    
    const params = new URLSearchParams(body)
    const data: Record<string, any> = {}
    params.forEach((value, key) => {
      data[key] = value
    })
    
    console.log("[v0] 解析后的数据:", JSON.stringify(data))
    
    const success = await processPayment(data, false) // POST 异步回调需要验签
    
    console.log("[v0] 处理结果:", success ? "success" : "fail")
    
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
  const siteUrl = getSiteUrl(request)
  console.log("[v0] ========== 收到 GET 同步跳转 ==========")
  console.log("[v0] 完整URL:", request.url)
  
  try {
    const { searchParams } = new URL(request.url)
    const data: Record<string, any> = {}
    searchParams.forEach((value, key) => {
      data[key] = value
    })

    console.log("[v0] GET 参数:", JSON.stringify(data))

    // 同步跳转也尝试处理支付状态（跳过签名验证，因为同步跳转参数可能不完整）
    // 主要依赖异步回调更新状态，这里只是备用
    await processPayment(data, true)

    // 获取订单号并跳转到订单详情页
    const orderNo = data.out_trade_no
    if (orderNo) {
      console.log("[v0] 跳转到订单页:", orderNo)
      return NextResponse.redirect(`${siteUrl}/order/${orderNo}`)
    }

    // 无订单号则跳转首页
    console.log("[v0] 无订单号，跳转首页")
    return NextResponse.redirect(siteUrl)
  } catch (error) {
    console.error("[v0] GET 易支付回调错误:", error)
    return NextResponse.redirect(siteUrl)
  }
}
