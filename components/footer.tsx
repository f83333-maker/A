import Link from "next/link"
import { Sparkles } from "lucide-react"

const footerLinks = {
  products: {
    title: "产品",
    links: [
      { name: "社交账号", href: "/category/social" },
      { name: "邮箱账号", href: "/category/email" },
      { name: "流媒体账号", href: "/category/video" },
      { name: "全部商品", href: "/products" },
    ],
  },
  support: {
    title: "支持",
    links: [
      { name: "帮助中心", href: "/help" },
      { name: "使用教程", href: "/tutorials" },
      { name: "常见问题", href: "/faq" },
      { name: "联系我们", href: "/contact" },
    ],
  },
  about: {
    title: "关于",
    links: [
      { name: "关于我们", href: "/about" },
      { name: "用户协议", href: "/terms" },
      { name: "隐私政策", href: "/privacy" },
      { name: "合作伙伴", href: "/partners" },
    ],
  },
}

export function Footer() {
  return (
    <footer className="bg-[#131314] border-t border-[#3c3c3f]/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8ab4f8] to-[#81c995] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#131314]" />
              </div>
              <span className="text-[16px] font-semibold text-[#e3e3e3]">
                Platform
              </span>
            </Link>
            <p className="text-[13px] text-[#6e6e73] leading-relaxed mb-6 font-medium">
              专业的账号批发服务平台，<br />
              为您提供安全可靠的服务。
            </p>
            {/* 社交图标 */}
            <div className="flex items-center gap-2">
              {["📧", "💬", "🐦"].map((icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-xl bg-[#2d2e30] hover:bg-[#3c3c3f] flex items-center justify-center text-[16px] transition-all duration-200"
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* 链接列表 */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-[13px] font-semibold text-[#e3e3e3] mb-4 uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-[#6e6e73] hover:text-[#e3e3e3] transition-colors font-medium"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-8 border-t border-[#3c3c3f]/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-[#6e6e73] font-medium">
              © 2024 Platform. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="text-[13px] text-[#6e6e73] hover:text-[#e3e3e3] transition-colors font-medium">
                服务条款
              </Link>
              <Link href="/privacy" className="text-[13px] text-[#6e6e73] hover:text-[#e3e3e3] transition-colors font-medium">
                隐私政策
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
