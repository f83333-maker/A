import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { verifyPassword } from "@/lib/crypto"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: "用户名和密码不能为空" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 查询管理员（使用新的 admin_users 表）
    const { data: admin, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("username", username)
      .single()

    if (error || !admin) {
      return NextResponse.json(
        { error: "用户名或密码错误" },
        { status: 401 }
      )
    }

    // 使用 scrypt + SHA3-512 验证密码
    const isValidPassword = await verifyPassword(
      password,
      admin.password_salt,
      admin.password_hash
    )

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "用户名或密码错误" },
        { status: 401 }
      )
    }

    // 更新最后登录时间
    await supabase
      .from("admin_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", admin.id)

    // 记录登录日志
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"
    
    await supabase
      .from("admin_login_log")
      .insert({
        admin_id: admin.id,
        ip_address: ip.split(",")[0].trim(),
        user_agent: userAgent,
      })

    // 创建session响应
    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    })

    // 设置管理员session cookie
    response.cookies.set("admin_session", JSON.stringify({
      id: admin.id,
      username: admin.username,
      loginAt: new Date().toISOString(),
    }), {
      httpOnly: true,  // 设为 true 增强安全性
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
