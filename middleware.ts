import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 保护管理员 API（排除登录/登出端点）
  if (pathname.startsWith('/api/admin') && 
      !pathname.startsWith('/api/admin/login') && 
      !pathname.startsWith('/api/admin/logout')) {
    
    const sessionCookie = request.cookies.get('admin_session')
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }
    
    try {
      const session = JSON.parse(sessionCookie.value)
      const loginTime = new Date(session.loginAt).getTime()
      const now = Date.now()
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      
      if (now - loginTime > sevenDays) {
        return NextResponse.json(
          { error: '登录已过期，请重新登录' },
          { status: 401 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: '无效的登录凭证' },
        { status: 401 }
      )
    }
  }
  
  // 处理 Supabase session 更新
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
