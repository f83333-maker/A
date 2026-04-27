"use client"

import useSWR from "swr"
import { ArrowLeft, Bell, Clock, Loader2, ChevronRight } from "lucide-react"
import Link from "next/link"

interface AnnouncementItem {
  id: string
  title: string
  content: string
  is_new: boolean
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, "-")
}

export default function AnnouncementsPage() {
  const { data: announcements, isLoading } = useSWR<AnnouncementItem[]>(
    "/api/announcements/all",
    fetcher
  )

  return (
    <div className="min-h-screen bg-[#000000] pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* 返回按钮 */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[14px] text-[#8c8c8c] hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        {/* 标题 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#7CFF00]/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-[#7CFF00]" />
          </div>
          <h1 className="text-[20px] font-semibold text-[#e3e3e3]">
            全部公告
          </h1>
        </div>

        {/* 公告列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#7CFF00]" />
          </div>
        ) : !announcements || announcements.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-[#222222] flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-[#6e6e73]" />
            </div>
            <p className="text-[14px] text-[#6e6e73]">暂无公告</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#222222] overflow-hidden">
            {announcements.map((item, index) => (
              <Link
                key={item.id}
                href={`/announcement/${item.id}`}
                className="group flex items-center justify-between px-5 py-4 hover:bg-[#111111] transition-colors border-b border-[#222222] last:border-b-0"
                style={{
                  animationDelay: `${index * 40}ms`,
                  animationFillMode: "backwards"
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* 新标签 */}
                  {item.is_new && (
                    <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-semibold text-[#ca3f64] bg-[#ca3f64]/10 rounded uppercase">
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
                  <ChevronRight className="w-4 h-4 text-[#6e6e73] group-hover:text-[#7CFF00] group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
