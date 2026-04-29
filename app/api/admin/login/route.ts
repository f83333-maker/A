import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

/**
 * 基于北京时间的动态登录系统
 * 账号: 年月日 (如 20260424)
 * 密码: 年月日时分 (如 202604241845)
 * 24小时制，以北京时间 (UTC+8) 为准
 */

function getBeijingTime(): { username: string; password: string; currentPassword: string; prevPassword: string } {
  // 获取当前UTC时间并转换为北京时间 (UTC+8)
  const now = new Date()
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
  const beijingTime = new Date(utcTime + (8 * 3600000))
  
  const year = beijingTime.getFullYear()
  const month = String(beijingTime.getMonth() + 1).padStart(2, '0')
  const day = String(beijingTime.getDate()).padStart(2, '0')
  const hour = String(beijingTime.getHours()).padStart(2, '0')
  const minute = String(beijingTime.getMinutes()).padStart(2, '0')
  
  // 当前账号密码
  const username = `${year}${month}${day}`
  const currentPassword = `${year}${month}${day}${hour}${minute}`
  
  // 计算前一分钟的密码（容错）
  const prevMinuteTime = new Date(beijingTime.getTime() - 60000)
  const prevYear = prevMinuteTime.getFullYear()
  const prevMonth = String(prevMinuteTime.getMonth() + 1).padStart(2, '0')
  const prevDay = String(prevMinuteTime.getDate()).padStart(2, '0')
  const prevHour = String(prevMinuteTime.getHours()).padStart(2, '0')
  const prevMinute = String(prevMinuteTime.getMinutes()).padStart(2, '0')
  const prevPassword = `${prevYear}${prevMonth}${prevDay}${prevHour}${prevMinute}`
  
  return { 
    username, 
    password: currentPassword,
    currentPassword,
    prevPassword
  }
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: "用户名和密码不能为空" },
        { status: 400 }
      )
    }

    // 获取当前北京时间对应的账号密码
    const beijingAuth = getBeijingTime()
    
    // 验证账号（必须是今天的日期）
    if (username !== beijingAuth.username) {
      return NextResponse.json(
        { error: "用户名或密码错误" },
        { status: 401 }
      )
    }
    
    // 验证密码（允许当前分钟或前一分钟，容错网络延迟）
    const isValidPassword = (
      password === beijingAuth.currentPassword || 
      password === beijingAuth.prevPassword
    )
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "用户名或密码错误" },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    // 记录登录日志到数据库
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"
    
    // 使用通用管理员ID记录登录
    const adminId = "00000000-0000-0000-0000-000000000001"
    
    await supabase
      .from("admin_login_log")
      .insert({
        admin_id: adminId,
        ip_address: ip.split(",")[0].trim(),
        user_agent: userAgent,
      })

    // 创建session响应
    const response = NextResponse.json({
      success: true,
      admin: {
        id: adminId,
        username: "admin",
      },
    })

    // 设置管理员session cookie (7天有效)
    response.cookies.set("admin_session", JSON.stringify({
      id: adminId,
      username: "admin",
      loginAt: new Date().toISOString(),
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7天
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    )
  }
}
