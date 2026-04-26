"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import { ArrowLeft, Bell, Clock, Loader2 } from "lucide-react"
import Link from "next/link"

interface Announcement {
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
    hour: "2-digit",
    minute: "2-digit",
  }).replace(/\//g, "-")
}

export default function AnnouncementDetailPage() {
  const params = useParams()
  const id = params.id as string
  
  const { data: announcement, isLoading, error } = useSWR<Announcement>(
    `/api/announcements/${id}`,
    fetcher
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7CFF00]" />
      </div>
    )
  }

  if (error || !announcement) {
    return (
      <div className="min-h-screen bg-[#000000] pt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-[#ca3f64]/10 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-[#ca3f64]" />
            </div>
            <h1 className="text-[20px] font-semibold text-[#e3e3e3] mb-2">公告不存在</h1>
            <p className="text-[14px] text-[#6e6e73] mb-6">该公告可能已被删除或不存在</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#7CFF00] hover:bg-[#9FFF40] text-black font-semibold rounded-full transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </Link>
          </div>
        </div>
      </div>
    )
  }

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

        {/* 公告卡片 */}
        <div className="bg-[#0D0D0D] border border-[#222222] rounded-2xl overflow-hidden">
          {/* 头部 */}
          <div className="px-6 py-5 border-b border-[#222222]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#7CFF00]/10 flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6 text-[#7CFF00]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {announcement.is_new && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold text-[#ca3f64] bg-[#ca3f64]/10 rounded uppercase">
                      New
                    </span>
                  )}
                </div>
                <h1 className="text-[20px] font-semibold text-[#e3e3e3] leading-relaxed mb-3">
                  {announcement.title}
                </h1>
                <div className="flex items-center gap-2 text-[13px] text-[#6e6e73]">
                  <Clock className="w-4 h-4" />
                  <span>发布于 {formatDate(announcement.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 内容 */}
          <div className="px-6 py-6">
            <div className="prose prose-invert max-w-none">
              <div className="text-[15px] text-[#b0b0b0] leading-relaxed whitespace-pre-wrap">
                {announcement.content || "暂无详细内容"}
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] hover:bg-[#252525] text-[#e3e3e3] font-medium rounded-full transition-all border border-[#333333]"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
