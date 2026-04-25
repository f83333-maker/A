"use client"

import { Search, Sparkles, ArrowRight, X } from "lucide-react"
import { useState, useEffect } from "react"

interface SearchBannerProps {
  searchQuery: string
  onSearch: (query: string) => void
}

export function SearchBanner({ searchQuery, onSearch }: SearchBannerProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [searchPlaceholder, setSearchPlaceholder] = useState("搜索产品名称、价格、库存、标签...")
  const [hotSearchTags, setHotSearchTags] = useState<string[]>(["社交账号", "邮箱账号", "游戏账号", "海外账号"])

  useEffect(() => {
    // 从API获取设置
    fetch("/api/site-settings")
      .then(res => res.json())
      .then(data => {
        if (data.search_placeholder) setSearchPlaceholder(data.search_placeholder)
        if (data.hot_search_tags && data.hot_search_tags.length > 0) setHotSearchTags(data.hot_search_tags)
      })
      .catch(err => console.error("获取设置失败:", err))
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

  return (
    <section className="pt-28 pb-8 md:pt-36 md:pb-12 relative overflow-hidden mosaic-bg">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#131314] via-transparent to-[#131314] pointer-events-none" />
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-[#8ab4f8]/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-[#81c995]/5 rounded-full blur-[100px]" />
      
      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        {/* 新功能标签 */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 mb-8 rounded-full border border-[#3c3c3f] bg-[#1e1f20]/80 backdrop-blur-sm animate-fade-in-up">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#81c995]" />
            <span className="text-[12px] text-[#9aa0a6]">New</span>
          </span>
          <span className="text-[13px] text-[#e3e3e3]">全新 2.0 版本已上线</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#6e6e73]" />
        </div>
        
        {/* 标题 */}
        <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-semibold text-[#e3e3e3] mb-5 tracking-[-0.02em] leading-[1.1] animate-fade-in-up delay-100">
          账号<span className="text-[#8ab4f8]"> 批发平台</span>
        </h1>
        
        <p className="text-[16px] sm:text-[18px] text-[#9aa0a6] mb-10 max-w-xl mx-auto leading-relaxed font-medium animate-fade-in-up delay-200">
          专业、安全、便捷的一站式账号服务平台
        </p>
        
        {/* 搜索框 */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto animate-fade-in-up delay-300">
          <div 
            className={`relative flex items-center bg-[#1e1f20] rounded-full border transition-all duration-300 ${
              isFocused 
                ? "border-[#8ab4f8] shadow-[0_0_0_1px_rgba(138,180,248,0.2)]" 
                : "border-[#3c3c3f] hover:border-[#5f6368]"
            }`}
          >
            <Search className={`ml-5 w-4 h-4 shrink-0 transition-colors duration-200 ${isFocused ? "text-[#8ab4f8]" : "text-[#6e6e73]"}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={searchPlaceholder}
              className="flex-1 h-11 px-3 bg-transparent text-[#e3e3e3] placeholder-[#6e6e73] focus:outline-none text-[14px] font-medium"
            />
            {/* 清除按钮 */}
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-full text-[#6e6e73] hover:text-[#e3e3e3] hover:bg-[#3c3c3f] transition-all duration-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="m-1.5 px-5 h-8 bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#131314] font-semibold rounded-full transition-all duration-200 text-[13px] flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              搜索
            </button>
          </div>
        </form>

        {/* 热门搜索 */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[13px] animate-fade-in-up delay-400">
          <span className="text-[#6e6e73]">热门:</span>
          {hotSearchTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-3.5 py-1.5 rounded-full transition-all duration-200 font-medium text-[13px] ${
                searchQuery === tag
                  ? "bg-[#8ab4f8]/20 text-[#8ab4f8] border border-[#8ab4f8]/40"
                  : "bg-[#2d2e30] text-[#9aa0a6] hover:bg-[#3c3c3f] hover:text-[#e3e3e3]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* 搜索结果提示 */}
        {searchQuery && (
          <div className="mt-6 animate-fade-in">
            <span className="text-[13px] text-[#6e6e73]">
              正在搜索 <span className="text-[#8ab4f8] font-medium">&ldquo;{searchQuery}&rdquo;</span> 的相关结果
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
