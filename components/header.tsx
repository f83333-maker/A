"use client"

import Link from "next/link"
import { Menu, X, ChevronRight } from "lucide-react"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"

const navItems = [
  { name: "首页", href: "#top", isAnchor: true },
  { name: "资源分类", href: "#categories", isAnchor: true },
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
        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 300)
      }
    } else {
      if (isHome) {
        const element = document.querySelector(item.href)
        if (element) element.scrollIntoView({ behavior: "smooth" })
      } else {
        router.push("/" + item.href)
        setTimeout(() => {
          const el = document.querySelector(item.href)
          if (el) el.scrollIntoView({ behavior: "smooth" })
        }, 400)
      }
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#000000]/95 backdrop-blur-xl border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#141414] flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:bg-[#1a1a1a]">
              <svg className="w-[26px] h-[26px]" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="#00d26a" stroke="#00d26a" strokeWidth="0.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[17px] font-bold text-[#ffffff] tracking-tight">
              出海资源铺
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                className="px-4 py-2 text-[14px] text-[#8c8c8c] hover:text-[#ffffff] transition-colors duration-200 rounded-full hover:bg-[#141414] font-medium cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[14px] text-[#000000] bg-[#00d26a] hover:bg-[#00e676] rounded-full transition-all duration-200 font-semibold cursor-pointer"
            >
              开始使用
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-[#8c8c8c] hover:text-[#ffffff] rounded-full hover:bg-[#141414] transition-all duration-200"
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
          <div className="py-4 border-t border-[#262626]">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className="px-4 py-3 text-[14px] text-[#8c8c8c] hover:text-[#ffffff] hover:bg-[#141414] rounded-xl transition-all duration-200 font-medium cursor-pointer"
                >
                  {item.name}
                </a>
              ))}
              <div className="flex gap-3 mt-4 px-4 pt-4 border-t border-[#262626]">
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
                  className="flex-1 py-2.5 text-[14px] text-center bg-[#00d26a] text-[#000000] rounded-full font-semibold hover:bg-[#00e676] transition-all duration-200 cursor-pointer"
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
