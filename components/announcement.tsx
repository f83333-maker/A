"use client"

import useSWR from "swr"
import { ChevronRight, Bell, Clock, Loader2 } from "lucide-react"
import Link from "next/link"

interface AnnouncementItem {
  id: string
  title: string
  content: string
  is_new: boolean
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// 默认公告数据
const defaultAnnouncements = [
  {
    id: "1",
    title: "平台系统升级公告",
    content: "",
    is_new: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "新用户注册优惠活动",
    content: "",
    is_new: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    title: "关于账号安全的重要提示",
    content: "",
    is_new: false,
    created_at: new Date().toISOString(),
  },
]

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, "-")
}

export function Announcement() {
  const { data, isLoading } = useSWR<AnnouncementItem[]>("/api/announcements", fetcher)
  
  const announcements = data && data.length > 0 ? data : defaultAnnouncements

  if (isLoading) {
    return (
      <section className="py-16 md:py-20 bg-[#000000]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-6 h-6 animate-spin text-[#8ab4f8]" />
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 md:py-20 bg-[#000000]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* 整体背景框 */}
        <div className="bg-[#0D0D0D] rounded-2xl p-6 md:p-8">
          {/* 标题 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8ab4f8]/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#8ab4f8]" />
              </div>
              <h2 className="text-[18px] font-semibold text-[#e3e3e3]">
                平台公告
              </h2>
            </div>
            <Link 
              href="/announcements" 
              className="text-[14px] text-[#8ab4f8] hover:text-[#aecbfa] transition-colors flex items-center gap-1"
            >
              全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 公告列表 */}
          <div className="rounded-xl border border-[#222222] overflow-hidden">
          {announcements.map((item, index) => (
            <Link
              key={item.id}
              href={`/announcement/${item.id}`}
              className="group flex items-center justify-between px-5 py-4 hover:bg-[#111111] transition-colors border-b border-[#222222] last:border-b-0 animate-fade-in"
              style={{ 
                animationDelay: `${index * 40}ms`,
                animationFillMode: "backwards"
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* 新标签 */}
                {item.is_new && (
                  <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-semibold text-[#ee675c] bg-[#ee675c]/10 rounded uppercase">
                    New
                  </span>
                )}
                
                {/* 标题 */}
                <span className="text-[14px] text-[#e3e3e3] group-hover:text-white truncate transition-colors font-medium">
                  {item.title}
                </span>
              </div>
              
              {/* 日期和箭头 */}
              <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                <span className="hidden sm:flex items-center gap-1.5 text-[12px] text-[#6e6e73] font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(item.created_at)}
                </span>
                <ChevronRight className="w-4 h-4 text-[#6e6e73] group-hover:text-[#8ab4f8] group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
          </div>
        </div>
      </div>
    </section>
  )
}
