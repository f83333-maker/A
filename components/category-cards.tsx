"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

const categories = [
  {
    name: "社交媒体",
    description: "Instagram, Twitter, TikTok",
    icon: "👥",
    href: "/category/social",
    color: "#7CFF00",
    count: "1,200+",
  },
  {
    name: "邮箱账号",
    description: "Gmail, Outlook, Yahoo",
    icon: "📧",
    href: "/category/email",
    color: "#81c995",
    count: "2,500+",
  },
  {
    name: "流媒体",
    description: "Netflix, Spotify, Disney+",
    icon: "🎬",
    href: "/category/video",
    color: "#fdd663",
    count: "800+",
  },
  {
    name: "通讯工具",
    description: "Discord, Telegram, WhatsApp",
    icon: "💬",
    href: "/category/messaging",
    color: "#af87c9",
    count: "950+",
  },
  {
    name: "电商平台",
    description: "Amazon, eBay, Shopify",
    icon: "🛒",
    href: "/category/ecommerce",
    color: "#ee675c",
    count: "600+",
  },
  {
    name: "海外服务",
    description: "国际平台账号服务",
    icon: "🌍",
    href: "/category/overseas",
    color: "#7CFF00",
    count: "1,500+",
  },
  {
    name: "应用商店",
    description: "App Store, Google Play",
    icon: "📱",
    href: "/category/mobile",
    color: "#81c995",
    count: "750+",
  },
  {
    name: "更多服务",
    description: "其他平台账号服务",
    icon: "✨",
    href: "/category/other",
    color: "#fdd663",
    count: "400+",
  },
]

// 高亮匹配文字
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-[#7CFF00]/25 text-[#7CFF00] rounded-[3px] px-[1px]">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

// 全字段模糊匹配
function matchesQuery(category: typeof categories[number], query: string): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase()
  return [
    category.name,
    category.description,
    category.count,
  ].some((field) => field.toLowerCase().includes(q))
}

interface CategoryCardsProps {
  searchQuery: string
  onCategorySearch: (query: string) => void
}

export function CategoryCards({ searchQuery, onCategorySearch }: CategoryCardsProps) {
  const filtered = categories.filter((c) => matchesQuery(c, searchQuery))

  return (
    <section className="py-16 md:py-20 bg-[#131314]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-[22px] sm:text-[26px] font-semibold text-[#e3e3e3] mb-3 tracking-[-0.01em]">
            产品分类
          </h2>
          <p className="text-[15px] text-[#9aa0a6] font-medium">
            {searchQuery && filtered.length < categories.length
              ? `找到 ${filtered.length} 个匹配分类`
              : "选择您需要的账号类型"}
          </p>
        </div>
        
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 animate-fade-in">
            <p className="text-[15px] font-medium text-[#6e6e73]">暂无匹配的分类</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filtered.map((category, index) => (
              <button
                key={category.name}
                onClick={() => onCategorySearch(category.name)}
                className="group relative p-5 bg-[#1e1f20] rounded-2xl border text-left transition-all duration-300 hover:bg-[#292a2c] animate-fade-in-up"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "backwards",
                  borderColor: searchQuery && category.name.toLowerCase().includes(searchQuery.toLowerCase())
                    ? "rgba(138,180,248,0.4)"
                    : "rgba(60,60,63,0.5)",
                }}
              >
                {/* 悬停光效 */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${category.color}08 0%, transparent 60%)`
                  }}
                />
                
                {/* 图标 */}
                <div className="text-[36px] mb-4 transition-transform duration-300 group-hover:scale-110">
                  {category.icon}
                </div>
                
                {/* 内容 */}
                <div className="relative">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-semibold text-[#e3e3e3] group-hover:text-white transition-colors">
                      <Highlight text={category.name} query={searchQuery} />
                    </h3>
                    <ArrowUpRight 
                      className="w-4 h-4 text-[#6e6e73] group-hover:text-[#7CFF00] transition-all duration-300 opacity-0 group-hover:opacity-100" 
                    />
                  </div>
                  <p className="text-[13px] text-[#6e6e73] mt-1 line-clamp-1 font-medium">
                    <Highlight text={category.description} query={searchQuery} />
                  </p>
                  <div 
                    className="mt-3 text-[12px] font-semibold"
                    style={{ color: category.color }}
                  >
                    <Highlight text={category.count} query={searchQuery} /> 商品
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
