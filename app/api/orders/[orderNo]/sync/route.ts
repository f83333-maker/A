import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getEpayConfig } from "@/lib/epay"

// 主动查询易支付订单状态
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  const { orderNo } = await params
  
  console.log("[v0] ========== 手动同步订单状态 ==========")
  console.log("[v0] 订单号:", orderNo)

  try {
    const supabase = await createClient()

    // 获取订单信息
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_no", orderNo)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: "订单不存在" })
    }

    // 如果订单已经是已支付/已发货状态，直接返回
    if (order.status === "delivered" || order.status === "paid") {
      return NextResponse.json({ 
        success: true, 
        message: "订单已处理",
        status: order.status 
      })
    }

    // 获取易支付配置
    const config = await getEpayConfig()
    
    if (!config.pid || !config.key || !config.apiUrl) {
      return NextResponse.json({ success: false, error: "支付配置未完成" })
    }

    // 易支付查询订单接口：api.php?act=order&pid=xxx&key=xxx&out_trade_no=xxx
    // 注意：查询接口直接使用 key 参数，不需要签名
    const apiUrl = config.apiUrl.endsWith("/") ? config.apiUrl : config.apiUrl + "/"
    const queryUrl = `${apiUrl}api.php?act=order&pid=${encodeURIComponent(config.pid)}&key=${encodeURIComponent(config.key)}&out_trade_no=${encodeURIComponent(orderNo)}`

    console.log("[v0] 查询URL:", queryUrl.replace(config.key, "***KEY***")) // 隐藏密钥

    // 请求易支付查询接口
    const response = await fetch(queryUrl)
    const result = await response.json()

    console.log("[v0] 易支付查询结果:", JSON.stringify(result))

    // 检查返回结果
    // 易支付返回格式：code=1 表示查询成功，status=1 表示订单已支付
    if (result.code !== 1) {
      console.log("[v0] 易支付查询失败:", result.msg)
      return NextResponse.json({ 
        success: false, 
        message: result.msg || "查询订单失败",
        epayResult: result
      })
    }

    // 检查订单支付状态
    if (result.status !== 1) {
      console.log("[v0] 订单未支付，status:", result.status)
      return NextResponse.json({ 
        success: false, 
        message: "订单尚未支付，请完成支付后再试",
        epayResult: result
      })
    }

    // 订单已支付 (code=1 && status=1)
    if (result.status === 1) {
      // 订单已支付，更新状态并发货
      console.log("[v0] 易支付确认订单已支付，开始处理发货")

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
        const deliveredIds = inventoryItems.map(item => item.id)
        const deliveredAccounts = inventoryItems.map(item => item.content)
        deliveredContent = deliveredAccounts.join("\n")

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

      // 更新订单状态
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "delivered",
          stripe_payment_intent_id: result.trade_no || result.tradeNo,
          epay_trade_no: result.trade_no || result.tradeNo,
          delivered_content: deliveredContent,
          delivered_at: new Date().toISOString(),
        })
        .eq("order_no", orderNo)

      if (updateError) {
        console.error("[v0] 更新订单状态失败:", updateError)
        return NextResponse.json({ success: false, error: "更新订单失败" })
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

      return NextResponse.json({ 
        success: true, 
        message: "订单已同步并发货",
        status: "delivered"
      })
    }
  } catch (error) {
    console.error("[v0] 同步订单状态错误:", error)
    return NextResponse.json({ success: false, error: "同步失败" })
  }
}
