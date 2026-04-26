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
  Boxes,
  BarChart3
} from "lucide-react"

const navItems = [
  { name: "仪表盘", href: "/admin", icon: LayoutDashboard },
  { name: "数据统计", href: "/admin/analytics", icon: BarChart3 },
  { name: "分类管理", href: "/admin/categories", icon: FolderTree },
  { name: "产品管理", href: "/admin/products", icon: Package },
  { name: "库存管理", href: "/admin/inventory", icon: Boxes },
  { name: "订单管理", href: "/admin/orders", icon: ShoppingCart },
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
        w-64 bg-[#1e1f20] border-r border-[#3c3c3f]
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#3c3c3f]">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#7CFF00]/20 flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-[#7CFF00]" />
              </div>
              <span className="text-[15px] font-semibold text-[#e3e3e3]">
                管理后台
              </span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-[#9aa0a6] hover:text-[#e3e3e3]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/admin" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium
                    transition-all duration-200
                    ${isActive 
                      ? "bg-[#7CFF00]/10 text-[#7CFF00]" 
                      : "text-[#9aa0a6] hover:bg-[#2d2e30] hover:text-[#e3e3e3]"
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                  {isActive && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* 底部操作 */}
          <div className="p-4 border-t border-[#3c3c3f]">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-[#9aa0a6] hover:bg-[#2d2e30] hover:text-[#e3e3e3] transition-all duration-200 mb-2"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              返回前台
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-[#ee675c] hover:bg-[#ee675c]/10 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              退出登录
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
