import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export interface AdminSession {
  id: string
  username: string
  loginAt: string
}

/**
 * 验证管理员 session
 * @returns AdminSession 如果验证成功，null 如果验证失败
 */
export async function verifyAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("admin_session")
    
    if (!sessionCookie?.value) {
      return null
    }
    
    const session = JSON.parse(sessionCookie.value) as AdminSession
    
    // 检查 session 是否有效（7天内）
    const loginTime = new Date(session.loginAt).getTime()
    const now = Date.now()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    
    if (now - loginTime > sevenDays) {
      return null
    }
    
    return session
  } catch {
    return null
  }
}

/**
 * 用于 API 路由的认证守卫
 * 如果未授权，返回 401 响应；否则返回 null 继续执行
 */
export async function requireAdminAuth(): Promise<NextResponse | null> {
  const session = await verifyAdminSession()
  
  if (!session) {
    return NextResponse.json(
      { error: "未授权访问" },
      { status: 401 }
    )
  }
  
  return null
}
