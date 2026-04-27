"use client"

import { Search, Sparkles, ArrowRight, X, Shield, Zap, Globe } from "lucide-react"
import { useState, useEffect, useRef } from "react"


interface SearchBannerProps {
  searchQuery: string
  onSearch: (query: string) => void
  initialTitle?: string
  initialSubtitle?: string
  initialPlaceholder?: string
  initialHotTags?: string[]
}

export function SearchBanner({
  searchQuery,
  onSearch,
  initialTitle = "",
  initialSubtitle = "",
  initialPlaceholder = "搜索产品名称、价格、库存、标签...",
  initialHotTags = ["社交媒体", "海外邮箱", "营销工具", "出海必备"],
}: SearchBannerProps) {
  const [isFocused, setIsFocused] = useState(false)
  // 直接使用服务端传来的初始值，无需客户端 fetch
  const searchPlaceholder = initialPlaceholder
  const hotSearchTags = initialHotTags
  const bannerTitle = initialTitle
  const bannerSubtitle = initialSubtitle
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const bannerRef = useRef<HTMLElement>(null)

  // 只记录访客，不再 fetch 设置
  useEffect(() => {
    fetch("/api/visitor", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: window.location.pathname })
    }).catch(() => {})
  }, [])

  // 鼠标跟随效果
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (bannerRef.current) {
        const rect = bannerRef.current.getBoundingClientRect()
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
          y: ((e.clientY - rect.top) / rect.height - 0.5) * 20
        })
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const scrollToCategory = () => {
    const el = document.getElementById("category-browser")
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    scrollToCategory()
  }

  const handleClear = () => {
    onSearch("")
  }

  const handleTagClick = (tag: string) => {
    onSearch(tag)
    scrollToCategory()
  }

  const features = [
    { icon: Shield, label: "安全可靠" },
    { icon: Zap, label: "即时交付" },
    { icon: Globe, label: "全球服务" },
  ]

  return (
    <section 
      ref={bannerRef}
      className="pt-24 pb-16 md:pt-32 md:pb-20 relative overflow-hidden bg-black"
    >
      {/* 动态网格背景 */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`
          }}
        />
      </div>

      {/* 动态光晕效果 */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, rgba(124,255,0,0.12) 0%, rgba(124,255,0,0.05) 30%, transparent 70%)`,
          transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      />
      
      {/* 浮动粒子 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#7CFF00]/30 rounded-full animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* 装饰线条 */}
      <div className="absolute top-1/4 left-0 w-32 h-[1px] bg-gradient-to-r from-transparent via-[#7CFF00]/20 to-transparent animate-pulse-slow" />
      <div className="absolute top-1/3 right-0 w-48 h-[1px] bg-gradient-to-l from-transparent via-[#7CFF00]/20 to-transparent animate-pulse-slow delay-1000" />
      <div className="absolute bottom-1/4 left-0 w-24 h-[1px] bg-gradient-to-r from-transparent via-[#7CFF00]/15 to-transparent animate-pulse-slow delay-500" />

      <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
        {/* 新版本标签 */}
        <div className="inline-flex items-center gap-3 px-5 py-2.5 mb-10 rounded-full border border-[#2A2A2A] bg-[#121212]/80 backdrop-blur-xl animate-fade-in-up group hover:border-[#7CFF00]/30 transition-all duration-500 cursor-default">
          <span className="relative flex items-center justify-center">
            <span className="absolute w-2 h-2 rounded-full bg-[#7CFF00] animate-ping opacity-75" />
            <span className="relative w-2 h-2 rounded-full bg-[#7CFF00]" />
          </span>
          <span className="text-[13px] text-[#737373] font-medium">NEW</span>
          <span className="w-[1px] h-3 bg-[#2A2A2A]" />
          <span className="text-[14px] text-white font-medium">全新 2.0 版本已上线</span>
          <ArrowRight className="w-4 h-4 text-[#525252] group-hover:text-[#7CFF00] group-hover:translate-x-0.5 transition-all duration-300" />
        </div>
        
        {/* 主标题 - 服务端直接渲染，无闪烁 */}
        <h1 className="text-[42px] sm:text-[56px] lg:text-[72px] font-bold text-white mb-6 tracking-[-0.03em] leading-[1.05] animate-fade-in-up delay-100">
          {bannerTitle.includes(" ") ? (
            <>
              <span className="relative inline-block">
                {bannerTitle.split(" ")[0]}
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-[#7CFF00] to-[#7CFF00]/0 rounded-full transform scale-x-0 animate-expand-line" />
              </span>
              <span className="relative ml-3">
                <span className="bg-gradient-to-r from-[#7CFF00] via-[#9FFF40] to-[#7CFF00] bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
                  {bannerTitle.split(" ").slice(1).join(" ")}
                </span>
              </span>
            </>
          ) : (
            <span className="bg-gradient-to-r from-[#7CFF00] to-[#9FFF40] bg-clip-text text-transparent">
              {bannerTitle}
            </span>
          )}
        </h1>

        {/* 副标题 - 服务端直接渲染，无闪烁 */}
        <p className="text-[17px] sm:text-[19px] text-[#737373] mb-8 max-w-2xl mx-auto leading-relaxed font-medium animate-fade-in-up delay-200">
          {bannerSubtitle}
        </p>

        {/* 特性标签 */}
        <div className="flex items-center justify-center gap-6 mb-12 animate-fade-in-up delay-250">
          {features.map((feature, index) => (
            <div 
              key={feature.label}
              className="flex items-center gap-2 text-[#525252] group cursor-default"
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              <feature.icon className="w-4 h-4 text-[#7CFF00]/70 group-hover:text-[#7CFF00] transition-colors duration-300" />
              <span className="text-[13px] font-medium group-hover:text-[#737373] transition-colors duration-300">{feature.label}</span>
            </div>
          ))}
        </div>
        
        {/* 搜索框 - OKX 风格 */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto animate-fade-in-up delay-300">
          <div 
            className={`relative flex items-center bg-[#121212] rounded-full border-2 transition-all duration-400 ${
              isFocused 
                ? "border-[#7CFF00] shadow-[0_0_30px_rgba(124,255,0,0.15)]" 
                : "border-[#2A2A2A] hover:border-[#404040]"
            }`}
          >
            <Search className={`ml-5 w-5 h-5 shrink-0 transition-all duration-300 ${isFocused ? "text-[#7CFF00] scale-110" : "text-[#525252]"}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={searchPlaceholder}
              className="flex-1 h-14 px-4 bg-transparent text-white placeholder-[#525252] focus:outline-none text-[15px] font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 rounded-full text-[#525252] hover:text-white hover:bg-[#2A2A2A] transition-all duration-200 mr-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="m-2 px-6 h-10 bg-[#7CFF00] hover:bg-[#9FFF40] text-black font-semibold rounded-full transition-all duration-300 text-[14px] flex items-center gap-2 shrink-0 hover:shadow-[0_0_20px_rgba(124,255,0,0.3)] active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              搜索
            </button>
          </div>
        </form>

        {/* 热门搜索 */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-in-up delay-400">
          <span className="text-[#525252] text-[13px] font-medium">热门:</span>
          {hotSearchTags.map((tag, index) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-4 py-2 rounded-full transition-all duration-300 font-medium text-[13px] border ${
                searchQuery === tag
                  ? "bg-[#7CFF00]/10 text-[#7CFF00] border-[#7CFF00]/30"
                  : "bg-transparent text-[#737373] border-[#2A2A2A] hover:border-[#404040] hover:text-white hover:bg-[#1A1A1A]"
              }`}
              style={{ animationDelay: `${500 + index * 50}ms` }}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* 搜索结果提示 */}
        {searchQuery && (
          <div className="mt-8 animate-fade-in">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7CFF00]/10 border border-[#7CFF00]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7CFF00] animate-pulse" />
              <span className="text-[13px] text-[#737373]">
                正在搜索 <span className="text-[#7CFF00] font-semibold">&ldquo;{searchQuery}&rdquo;</span>
              </span>
            </span>
          </div>
        )}
      </div>

      {/* 底部渐变线 */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#2A2A2A] to-transparent" />
    </section>
  )
}
