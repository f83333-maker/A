"use client"

import Link from "next/link"
import { Menu, X, Sparkles, ChevronRight, Search, Shield, BookOpen } from "lucide-react"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"

const navItems = [
  { name: "首页", href: "#top", isAnchor: true },
  { name: "账号类别", href: "#categories", isAnchor: true },
  { name: "订单查询", href: "/order-query" },
  { name: "2FA验证", href: "/2fa" },
  { name: "使用教程", href: "/tutorial" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: typeof navItems[0]) => {
    if (!item.isAnchor) return
    e.preventDefault()
    setMobileMenuOpen(false)

    const isHome = pathname === "/"

    if (item.href === "#top") {
      if (isHome) {
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        router.push("/")
        // 跳转后等页面加载再滚到顶部
        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 300)
      }
    } else {
      if (isHome) {
        const element = document.querySelector(item.href)
        if (element) element.scrollIntoView({ behavior: "smooth" })
      } else {
        // 跳回首页并带 hash，首页加载后自动定位到 #categories
        router.push("/" + item.href)
        setTimeout(() => {
          const el = document.querySelector(item.href)
          if (el) el.scrollIntoView({ behavior: "smooth" })
        }, 400)
      }
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#131314]/90 backdrop-blur-xl border-b border-[#3c3c3f]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - ChatGPT风格，搜索按钮配色 */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-[#8ab4f8] flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-[#8ab4f8]/30">
              <svg className="w-5 h-5 text-[#131314]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <span className="text-[17px] font-bold text-[#e3e3e3] tracking-tight">
              CHUHAIZIYUAN
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                className="px-4 py-2 text-[14px] text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors duration-200 rounded-full hover:bg-[#2d2e30]/80 font-medium cursor-pointer"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="#categories"
              onClick={(e) => {
                e.preventDefault()
                const isHome = pathname === "/"
                if (isHome) {
                  const el = document.querySelector("#categories")
                  if (el) el.scrollIntoView({ behavior: "smooth" })
                } else {
                  router.push("/#categories")
                  setTimeout(() => {
                    const el = document.querySelector("#categories")
                    if (el) el.scrollIntoView({ behavior: "smooth" })
                  }, 400)
                }
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-[14px] text-[#131314] bg-[#8ab4f8] hover:bg-[#aecbfa] rounded-full transition-all duration-200 font-semibold cursor-pointer"
            >
              开始使用
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-[#9aa0a6] hover:text-[#e3e3e3] rounded-full hover:bg-[#2d2e30] transition-all duration-200"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="py-4 border-t border-[#3c3c3f]/50">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className="px-4 py-3 text-[14px] text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#2d2e30] rounded-xl transition-all duration-200 font-medium cursor-pointer"
                >
                  {item.name}
                </a>
              ))}
              <div className="flex gap-3 mt-4 px-4 pt-4 border-t border-[#3c3c3f]/50">
                <a
                  href="#categories"
                  onClick={(e) => {
                    e.preventDefault()
                    setMobileMenuOpen(false)
                    const isHome = pathname === "/"
                    if (isHome) {
                      const el = document.querySelector("#categories")
                      if (el) el.scrollIntoView({ behavior: "smooth" })
                    } else {
                      router.push("/#categories")
                      setTimeout(() => {
                        const el = document.querySelector("#categories")
                        if (el) el.scrollIntoView({ behavior: "smooth" })
                      }, 400)
                    }
                  }}
                  className="flex-1 py-2.5 text-[14px] text-center bg-[#8ab4f8] text-[#131314] rounded-full font-semibold hover:bg-[#aecbfa] transition-all duration-200 cursor-pointer"
                >
                  开始使用
                </a>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}
