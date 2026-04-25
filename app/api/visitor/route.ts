import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// 解析设备类型
function parseDevice(userAgent: string): { type: string; info: string } {
  const ua = userAgent.toLowerCase()
  
  let type = "Desktop"
  let info = "未知设备"
  
  // 检测移动设备
  if (/iphone|ipod/.test(ua)) {
    type = "iPhone"
    const match = ua.match(/iphone os (\d+[_\d]*)/)
    info = `iPhone iOS ${match ? match[1].replace(/_/g, ".") : ""}`
  } else if (/ipad/.test(ua)) {
    type = "iPad"
    info = "iPad"
  } else if (/android/.test(ua)) {
    type = "Android"
    const match = ua.match(/android (\d+\.?\d*)/)
    info = `Android ${match ? match[1] : ""}`
    if (/mobile/.test(ua)) {
      type = "Android Phone"
    } else {
      type = "Android Tablet"
    }
  } else if (/windows phone/.test(ua)) {
    type = "Windows Phone"
    info = "Windows Phone"
  } else if (/macintosh|mac os x/.test(ua)) {
    type = "Mac"
    info = "macOS"
  } else if (/windows/.test(ua)) {
    type = "Windows"
    const match = ua.match(/windows nt (\d+\.?\d*)/)
    if (match) {
      const version = match[1]
      if (version === "10.0") info = "Windows 10/11"
      else if (version === "6.3") info = "Windows 8.1"
      else if (version === "6.2") info = "Windows 8"
      else if (version === "6.1") info = "Windows 7"
      else info = `Windows NT ${version}`
    } else {
      info = "Windows"
    }
  } else if (/linux/.test(ua)) {
    type = "Linux"
    info = "Linux"
  }
  
  // 检测浏览器
  let browser = ""
  if (/edg/.test(ua)) browser = "Edge"
  else if (/chrome/.test(ua) && !/edg/.test(ua)) browser = "Chrome"
  else if (/safari/.test(ua) && !/chrome/.test(ua)) browser = "Safari"
  else if (/firefox/.test(ua)) browser = "Firefox"
  else if (/opera|opr/.test(ua)) browser = "Opera"
  
  if (browser) info += ` / ${browser}`
  
  return { type, info }
}

// 生成会话ID
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

// 记录访客
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  // 获取访客IP
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"
  const userAgent = request.headers.get("user-agent") || ""
  
  const body = await request.json().catch(() => ({}))
  const pageUrl = body.page || "/"
  const productId = body.productId || null
  const sessionId = body.sessionId || generateSessionId()
  const orderNo = body.orderNo || null
  
  // 解析设备信息
  const { type: deviceType, info: deviceInfo } = parseDevice(userAgent)
  
  // 获取IP地理位置
  let ipLocation = "未知"
  try {
    if (ip && ip !== "unknown" && !ip.startsWith("192.168.") && !ip.startsWith("10.") && ip !== "127.0.0.1") {
      const locationRes = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN&fields=status,regionName,city`)
      const locationData = await locationRes.json()
      if (locationData.status === "success") {
        ipLocation = `${locationData.regionName || ""}${locationData.city || ""}` || "未知"
      }
    }
  } catch {
    // 忽略地理位置解析错误
  }
  
  // 检查12小时内是否已记录过此IP+页面组合
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  
  const { data: existing } = await supabase
    .from("visitor_stats")
    .select("id, viewed_products, session_id")
    .eq("ip_address", ip)
    .gte("visited_at", twelveHoursAgo)
    .order("visited_at", { ascending: false })
    .limit(1)
  
  // 如果12小时内有记录，更新浏览的商品列表
  if (existing && existing.length > 0) {
    const record = existing[0]
    let viewedProducts = record.viewed_products || []
    
    // 如果有新的商品浏览，添加到列表
    if (productId && !viewedProducts.includes(productId)) {
      viewedProducts = [...viewedProducts, productId]
      await supabase
        .from("visitor_stats")
        .update({ 
          viewed_products: viewedProducts,
          ...(orderNo ? { order_no: orderNo } : {})
        })
        .eq("id", record.id)
    } else if (orderNo) {
      // 更新订单号
      await supabase
        .from("visitor_stats")
        .update({ order_no: orderNo })
        .eq("id", record.id)
    }
    
    return NextResponse.json({ success: true, sessionId: record.session_id })
  }
  
  // 新访客记录
  const insertData: Record<string, unknown> = {
    ip_address: ip,
    user_agent: userAgent,
    page_url: pageUrl,
    device_type: deviceType,
    device_info: deviceInfo,
    ip_location: ipLocation,
    session_id: sessionId,
    viewed_products: productId ? [productId] : [],
  }
  
  if (orderNo) {
    insertData.order_no = orderNo
  }
  
  await supabase.from("visitor_stats").insert(insertData)
  
  return NextResponse.json({ success: true, sessionId })
}

// 获取今日访客数（去重）
export async function GET() {
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
  
  // 获取今日所有访客记录
  const { data } = await supabase
    .from("visitor_stats")
    .select("*")
    .gte("visited_at", todayStart.toISOString())
    .order("visited_at", { ascending: true })
  
  // 去重计数
  const uniqueIPs = new Set(data?.map(v => v.ip_address) || [])
  
  return NextResponse.json({ 
    today: uniqueIPs.size,
    visitors: data || [],
    timestamp: new Date().toISOString()
  })
}
