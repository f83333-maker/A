import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// 记录访客
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  // 获取访客IP
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"
  const userAgent = request.headers.get("user-agent") || ""
  
  const body = await request.json().catch(() => ({}))
  const pageUrl = body.page || "/"
  
  // 检查12小时内是否已记录过此IP
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  
  const { data: existing } = await supabase
    .from("visitor_stats")
    .select("id")
    .eq("ip_address", ip)
    .gte("visited_at", twelveHoursAgo)
    .limit(1)
  
  // 如果12小时内没有记录，则添加新记录
  if (!existing || existing.length === 0) {
    await supabase.from("visitor_stats").insert({
      ip_address: ip,
      user_agent: userAgent,
      page_url: pageUrl,
    })
  }
  
  return NextResponse.json({ success: true })
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
  
  // 统计今日独立IP数
  const { data } = await supabase
    .from("visitor_stats")
    .select("ip_address")
    .gte("visited_at", todayStart.toISOString())
  
  // 去重计数
  const uniqueIPs = new Set(data?.map(v => v.ip_address) || [])
  
  return NextResponse.json({ 
    today: uniqueIPs.size,
    timestamp: new Date().toISOString()
  })
}
