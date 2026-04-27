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
  const [contactTelegram, setContactTelegram] = useState("")
  const [contactQQ, setContactQQ] = useState("")
  const [contactEmail, setContactEmail] = useState("")

  useEffect(() => {
    fetch("/api/site-settings")
      .then(res => res.json())
      .then(data => {
        if (data.footer_links && data.footer_links.length > 0) {
          setFooterLinks(data.footer_links)
        }
        if (data.contact_telegram) setContactTelegram(data.contact_telegram)
        if (data.contact_qq) setContactQQ(data.contact_qq)
        if (data.contact_email) setContactEmail(data.contact_email)
      })
      .catch(err => console.error("获取设置失败:", err))
  }, [])

  return (
    <footer className="bg-[#000000] border-t border-[#222222]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <div className="w-8 h-8 rounded-lg bg-[#111111] flex items-center justify-center transition-all group-hover:bg-[#222222]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="#7CFF00" stroke="#7CFF00" strokeWidth="0.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[16px] font-bold text-[#e3e3e3]">
                CrossBorder Hub
              </span>
            </Link>
            <p className="text-[13px] text-[#6e6e73] leading-relaxed mb-6 font-medium">
              一站式跨境资源采购平台，<br />
              助力全球化业务拓展。
            </p>
            {/* 社交图标 */}
            <div className="flex items-center gap-2">
              {/* Telegram */}
              <a
                href={contactTelegram ? (contactTelegram.startsWith("http") ? contactTelegram : `https://t.me/${contactTelegram.replace("@", "")}`) : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#111111] hover:bg-[#222222] flex items-center justify-center transition-all duration-200"
                title="Telegram"
              >
                <svg className="w-5 h-5 text-[#6e6e73]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
              {/* QQ */}
              <a
                href={contactQQ ? (contactQQ.startsWith("http") ? contactQQ : `tencent://message/?uin=${contactQQ}`) : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#111111] hover:bg-[#222222] flex items-center justify-center transition-all duration-200"
                title="QQ"
              >
                <svg className="w-5 h-5 text-[#6e6e73]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 14.96 3.55 17.474c0 .665.17 1.025.281 1.025.114 0 .902-.484 1.748-2.072 0 0-.18 2.197 1.904 3.967 0 0-1.77.495-1.77 1.182 0 .686 4.078.43 6.29.43 2.213 0 6.29.256 6.29-.43 0-.687-1.77-1.182-1.77-1.182 2.085-1.77 1.905-3.967 1.905-3.967.845 1.588 1.634 2.072 1.746 2.072.111 0 .283-.36.283-1.025 0-2.514-2.166-6.954-2.166-6.954V9.325C18.29 3.364 14.268 2 12.003 2z"/>
                </svg>
              </a>
              {/* 邮箱 */}
              <a
                href={contactEmail ? `mailto:${contactEmail}` : "#"}
                className="w-9 h-9 rounded-xl bg-[#111111] hover:bg-[#222222] flex items-center justify-center transition-all duration-200"
                title="邮箱"
              >
                <svg className="w-5 h-5 text-[#6e6e73]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </a>
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
        <div className="mt-14 pt-8 border-t border-[#222222]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-[#6e6e73] font-medium">
              © 2024 CrossBorder Hub. All rights reserved.
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
