"use client"

import Link from "next/link"
import { Menu, X, Headphones, Send, MessageCircle, Mail } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"

const navItems = [
  { name: "首页", href: "#top", isAnchor: true },
  { name: "资源分类", href: "#category-browser", isAnchor: true },
  { name: "订单查询", href: "/order-query" },
  { name: "2FA验证", href: "/2fa" },
  { name: "使用教程", href: "/tutorial" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [contactDropdownOpen, setContactDropdownOpen] = useState(false)
  const [contactInfo, setContactInfo] = useState({
    telegram: "",
    qq: "",
    email: ""
  })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  // 获取联系方式设置
  useEffect(() => {
    fetch("/api/site-settings")
      .then(res => res.json())
      .then(data => {
        setContactInfo({
          telegram: data.contact_telegram || "",
          qq: data.contact_qq || "",
          email: data.contact_email || ""
        })
      })
      .catch(err => console.error("获取联系方式失败:", err))
  }, [])

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setContactDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
                <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="#7CFF00" stroke="#7CFF00" strokeWidth="0.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[17px] font-bold text-[#ffffff] tracking-tight">
              CrossBorder Hub
            </span>
          </Link>

          {/* Desktop Navigation - 右对齐，字体加大加粗 */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                className="px-5 py-2 text-[15px] text-[#a0a0a0] hover:text-[#ffffff] transition-colors duration-200 rounded-full hover:bg-[#141414] font-semibold cursor-pointer"
              >
                {item.name}
              </a>
            ))}
            
            {/* 联系客服按钮 */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setContactDropdownOpen(!contactDropdownOpen)}
                className="flex items-center gap-1.5 px-5 py-2 text-[15px] text-[#a0a0a0] hover:text-[#ffffff] transition-colors duration-200 rounded-full hover:bg-[#141414] font-semibold cursor-pointer"
              >
                <Headphones className="w-4 h-4" />
                联系客服
              </button>
              
              {/* 下拉菜单 */}
              {contactDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="p-2">
                    {contactInfo.telegram && (
                      <a
                        href={contactInfo.telegram.startsWith("http") ? contactInfo.telegram : `https://t.me/${contactInfo.telegram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2.5 text-[14px] text-[#a0a0a0] hover:text-white hover:bg-[#252525] rounded-lg transition-colors"
                        onClick={() => setContactDropdownOpen(false)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#0088cc]/15 flex items-center justify-center">
                          <Send className="w-4 h-4 text-[#0088cc]" />
                        </div>
                        <div>
                          <div className="font-medium">Telegram</div>
                          <div className="text-[12px] text-[#6e6e73]">{contactInfo.telegram}</div>
                        </div>
                      </a>
                    )}
                    {contactInfo.qq && (
                      <a
                        href={contactInfo.qq.startsWith("http") ? contactInfo.qq : `tencent://message/?uin=${contactInfo.qq}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2.5 text-[14px] text-[#a0a0a0] hover:text-white hover:bg-[#252525] rounded-lg transition-colors"
                        onClick={() => setContactDropdownOpen(false)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#12B7F5]/15 flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-[#12B7F5]" />
                        </div>
                        <div>
                          <div className="font-medium">QQ</div>
                          <div className="text-[12px] text-[#6e6e73]">{contactInfo.qq}</div>
                        </div>
                      </a>
                    )}
                    {contactInfo.email && (
                      <a
                        href={`mailto:${contactInfo.email}`}
                        className="flex items-center gap-3 px-3 py-2.5 text-[14px] text-[#a0a0a0] hover:text-white hover:bg-[#252525] rounded-lg transition-colors"
                        onClick={() => setContactDropdownOpen(false)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#7CFF00]/15 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-[#7CFF00]" />
                        </div>
                        <div>
                          <div className="font-medium">邮箱</div>
                          <div className="text-[12px] text-[#6e6e73]">{contactInfo.email}</div>
                        </div>
                      </a>
                    )}
                    {!contactInfo.telegram && !contactInfo.qq && !contactInfo.email && (
                      <div className="px-3 py-4 text-[13px] text-[#6e6e73] text-center">
                        暂未设置联系方式
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>

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
              
              {/* 移动端联系客服 */}
              <div className="mt-2 pt-2 border-t border-[#262626]">
                <div className="px-4 py-2 text-[12px] text-[#6e6e73] font-medium">联系客服</div>
                <div className="flex flex-col gap-1">
                  {contactInfo.telegram && (
                    <a
                      href={contactInfo.telegram.startsWith("http") ? contactInfo.telegram : `https://t.me/${contactInfo.telegram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#8c8c8c] hover:text-white hover:bg-[#141414] rounded-xl transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Send className="w-4 h-4 text-[#0088cc]" />
                      <span>Telegram</span>
                    </a>
                  )}
                  {contactInfo.qq && (
                    <a
                      href={contactInfo.qq.startsWith("http") ? contactInfo.qq : `tencent://message/?uin=${contactInfo.qq}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#8c8c8c] hover:text-white hover:bg-[#141414] rounded-xl transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <MessageCircle className="w-4 h-4 text-[#12B7F5]" />
                      <span>QQ</span>
                    </a>
                  )}
                  {contactInfo.email && (
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#8c8c8c] hover:text-white hover:bg-[#141414] rounded-xl transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Mail className="w-4 h-4 text-[#7CFF00]" />
                      <span>邮箱</span>
                    </a>
                  )}
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}
