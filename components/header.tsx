"use client"

import Link from "next/link"
import { Menu, X, Sparkles, ChevronRight, Search, Shield, BookOpen } from "lucide-react"
import { useState } from "react"

const navItems = [
  { name: "首页", href: "#top", isAnchor: true },
  { name: "账号类别", href: "#categories", isAnchor: true },
  { name: "订单查询", href: "/order-query" },
  { name: "2FA验证", href: "/2fa" },
  { name: "使用教程", href: "/tutorial" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: typeof navItems[0]) => {
    if (item.isAnchor) {
      e.preventDefault()
      if (item.href === "#top") {
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        const element = document.querySelector(item.href)
        if (element) {
          element.scrollIntoView({ behavior: "smooth" })
        }
      }
      setMobileMenuOpen(false)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#131314]/90 backdrop-blur-xl border-b border-[#3c3c3f]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8ab4f8] to-[#81c995] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <Sparkles className="w-4 h-4 text-[#131314]" />
            </div>
            <span className="text-[17px] font-semibold text-[#e3e3e3] tracking-[-0.01em]">
              Platform
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
            <Link
              href="/login"
              className="px-4 py-2 text-[14px] text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors font-medium"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[14px] text-[#e3e3e3] bg-[#2d2e30] hover:bg-[#3c3c3f] border border-[#3c3c3f] hover:border-[#5f6368] rounded-full transition-all duration-200 font-semibold"
            >
              开始使用
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
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
                <Link
                  href="/login"
                  className="flex-1 py-2.5 text-[14px] text-center text-[#9aa0a6] border border-[#3c3c3f] rounded-full hover:bg-[#2d2e30] transition-all duration-200 font-medium"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="flex-1 py-2.5 text-[14px] text-center bg-[#8ab4f8] text-[#131314] rounded-full font-semibold hover:bg-[#aecbfa] transition-all duration-200"
                >
                  注册
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}
