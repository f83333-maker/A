import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 获取北京时间今天的起始时间
    const now = new Date()
    const beijingOffset = 8 * 60 * 60 * 1000
    const beijingNow = new Date(now.getTime() + beijingOffset)
    const todayStart = new Date(
      beijingNow.getFullYear(),
      beijingNow.getMonth(),
      beijingNow.getDate()
    )
    todayStart.setTime(todayStart.getTime() - beijingOffset)

    // 获取今日访客
    const { data: visitorData, error: visitorError } = await supabase
      .from("visitor_stats")
      .select("*")
      .gte("visited_at", todayStart.toISOString())
      .order("visited_at", { ascending: false })
    
    if (visitorError) {
      console.error("获取访客数据失败:", visitorError)
    }
    
    // 去重计数（同一IP只算一次）
    const uniqueVisitors: any[] = []
    const seenIPs = new Set<string>()
    visitorData?.forEach(v => {
      if (!seenIPs.has(v.ip_address)) {
        seenIPs.add(v.ip_address)
        uniqueVisitors.push(v)
      }
    })

    // 获取今日订单
    const { data: todayOrderData } = await supabase
      .from("orders")
      .select("total_amount, status, quantity, unit_price")
      .gte("created_at", todayStart.toISOString())

    let todayRevenue = 0
    let todayProfit = 0
    todayOrderData?.forEach(order => {
      if (order.status === "completed" || order.status === "paid") {
        todayRevenue += Number(order.total_amount) || 0
        // 假设利润率为 30%
        todayProfit += (Number(order.total_amount) || 0) * 0.3
      }
    })

    // 获取产品列表用于显示浏览的商品名
    const { data: products } = await supabase
      .from("products")
      .select("id, name")

    return NextResponse.json({
      stats: {
        todayVisitors: uniqueVisitors.length,
        todayOrders: todayOrderData?.length || 0,
        todayRevenue,
        todayProfit,
      },
      visitors: uniqueVisitors,
      products: products || []
    })
  } catch (error) {
    console.error("获取分析数据失败:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
