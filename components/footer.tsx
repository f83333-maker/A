"use client"

import Link from "next/link"
import { useState, useEffect } from "react"

interface FooterLink {
  name: string
  url: string
}

export function Footer() {
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([
    { name: "服务条款", url: "/terms" },
    { name: "隐私政策", url: "/privacy" },
  ])

  useEffect(() => {
    fetch("/api/site-settings")
      .then(res => res.json())
      .then(data => {
        if (data.footer_links && data.footer_links.length > 0) {
          setFooterLinks(data.footer_links)
        }
      })
      .catch(err => console.error("获取设置失败:", err))
  }, [])

  return (
    <footer className="bg-[#131314] border-t border-[#3c3c3f]/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <div className="w-8 h-8 rounded-lg bg-[#2d2e30] flex items-center justify-center transition-all group-hover:bg-[#3c3c3f]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="#8ab4f8" stroke="#8ab4f8" strokeWidth="0.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[16px] font-bold text-[#e3e3e3]">
                CHUHAIZIYUAN
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

          {/* 快速链接 */}
          <div>
            <h3 className="text-[13px] font-semibold text-[#e3e3e3] mb-4 uppercase tracking-wider">
              快速链接
            </h3>
            <ul className="space-y-3">
              {footerLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.url}
                    className="text-[13px] text-[#6e6e73] hover:text-[#e3e3e3] transition-colors font-medium"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 联系方式 */}
          <div>
            <h3 className="text-[13px] font-semibold text-[#e3e3e3] mb-4 uppercase tracking-wider">
              联系我们
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/order-query"
                  className="text-[13px] text-[#6e6e73] hover:text-[#e3e3e3] transition-colors font-medium"
                >
                  订单查询
                </Link>
              </li>
              <li>
                <span className="text-[13px] text-[#6e6e73] font-medium">
                  24小时自动发货
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-8 border-t border-[#3c3c3f]/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-[#6e6e73] font-medium">
              © 2024 CHUHAIZIYUAN. All rights reserved.
            </p>
            <div className="flex items-center gap-6 flex-wrap justify-center">
              {footerLinks.slice(0, 4).map((link, index) => (
                <Link 
                  key={index}
                  href={link.url} 
                  className="text-[13px] text-[#6e6e73] hover:text-[#e3e3e3] transition-colors font-medium"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
