"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  FolderTree, 
  Package, 
  Megaphone, 
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Loader2,
  ShoppingCart,
  BarChart3
} from "lucide-react"

const navItems = [
  { name: "仪表盘", href: "/admin", icon: LayoutDashboard },
  { name: "订单管理", href: "/admin/orders", icon: ShoppingCart },
  { name: "商品管理", href: "/admin/products", icon: Package },
  { name: "分类管理", href: "/admin/categories", icon: FolderTree },
  { name: "数据统计", href: "/admin/analytics", icon: BarChart3 },
  { name: "公告管理", href: "/admin/announcements", icon: Megaphone },
  { name: "网站设置", href: "/admin/settings", icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // 登录页面不需要验证
  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    if (isLoginPage) {
      setIsChecking(false)
      return
    }

    // 检查 localStorage 中是否有 admin_session
    const checkAuth = () => {
      const session = localStorage.getItem("admin_session")
      
      if (!session) {
        router.push("/admin/login")
      } else {
        setIsAuthenticated(true)
      }
      setIsChecking(false)
    }

    checkAuth()
  }, [pathname, router, isLoginPage])

  // 登录页面直接渲染
  if (isLoginPage) {
    return <>{children}</>
  }

  // 验证中显示加载
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#131314] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#7CFF00] animate-spin" />
      </div>
    )
  }

  // 未验证时不渲染内容（会跳转到登录页）
  if (!isAuthenticated) {
    return null
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_session")
    window.location.href = "/admin/login"
  }

  return (
    <div className="min-h-screen bg-[#131314] flex admin-selectable">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        group/sidebar
        w-14 hover:w-44 lg:w-14 lg:hover:w-44
        bg-[#1e1f20] border-r border-[#3c3c3f]
        transition-[width] duration-200 ease-in-out overflow-hidden
        ${sidebarOpen ? "w-44 translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="flex flex-col h-full w-44">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-3 border-b border-[#3c3c3f] shrink-0">
            <Link href="/admin" className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#7CFF00]/20 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-4 h-4 text-[#7CFF00]" />
              </div>
              <span className="text-[14px] font-semibold text-[#e3e3e3] whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150">
                管理后台
              </span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-[#9aa0a6] hover:text-[#e3e3e3] shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/admin" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  title={item.name}
                  className={`
                    flex items-center gap-3 px-2 py-2.5 rounded-xl text-[13px] font-medium
                    transition-colors duration-150 whitespace-nowrap
                    ${isActive 
                      ? "bg-[#7CFF00]/10 text-[#7CFF00]" 
                      : "text-[#9aa0a6] hover:bg-[#2d2e30] hover:text-[#e3e3e3]"
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 flex-1">
                    {item.name}
                  </span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 shrink-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* 底部操作 */}
          <div className="px-2 py-3 border-t border-[#3c3c3f] space-y-0.5 shrink-0">
            <Link
              href="/"
              title="返回前台"
              className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-[13px] font-medium text-[#9aa0a6] hover:bg-[#2d2e30] hover:text-[#e3e3e3] transition-colors duration-150 whitespace-nowrap"
            >
              <ChevronRight className="w-4 h-4 rotate-180 shrink-0" />
              <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150">返回前台</span>
            </Link>
            <button
              onClick={handleLogout}
              title="退出登录"
              className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-[13px] font-medium text-[#ee675c] hover:bg-[#ee675c]/10 transition-colors duration-150 whitespace-nowrap"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150">退出登录</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* 顶部栏 */}
        <header className="h-16 bg-[#1e1f20] border-b border-[#3c3c3f] flex items-center px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-[#9aa0a6] hover:text-[#e3e3e3]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="text-[13px] text-[#9aa0a6] font-medium">
            管理员
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
