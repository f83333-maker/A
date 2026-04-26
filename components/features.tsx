"use client"

import useSWR from "swr"
import { Loader2 } from "lucide-react"

interface Feature {
  id: string
  icon: string
  title: string
  description: string
  color: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// 默认特性数据（当数据库没有数据时显示）
const defaultFeatures = [
  {
    id: "1",
    icon: "🛡️",
    title: "安全保障",
    description: "多重验证机制，确保交易安全",
    color: "#7CFF00",
  },
  {
    id: "2",
    icon: "⚡",
    title: "即时发货",
    description: "自动化系统，秒级交付体验",
    color: "#81c995",
  },
  {
    id: "3",
    icon: "🕐",
    title: "全天服务",
    description: "7x24小时在线，随时解答疑问",
    color: "#fdd663",
  },
  {
    id: "4",
    icon: "💝",
    title: "售后无忧",
    description: "完善售后体系，保障您的权益",
    color: "#af87c9",
  },
]

export function Features() {
  const { data, isLoading } = useSWR<Feature[]>("/api/features", fetcher)
  
  const features = data && data.length > 0 ? data : defaultFeatures

  if (isLoading) {
    return (
      <section className="py-16 md:py-20 bg-[#131314] border-y border-[#3c3c3f]/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-center min-h-[120px]">
          <Loader2 className="w-6 h-6 animate-spin text-[#7CFF00]" />
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 md:py-20 bg-[#131314] border-y border-[#3c3c3f]/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.id} 
              className="group text-center p-6 rounded-2xl bg-[#1e1f20]/50 border border-transparent hover:border-[#3c3c3f]/50 transition-all duration-300 animate-fade-in-up"
              style={{ 
                animationDelay: `${index * 80}ms`,
                animationFillMode: "backwards"
              }}
            >
              {/* 图标 */}
              <div className="inline-flex items-center justify-center w-14 h-14 mb-4 text-[32px] rounded-2xl bg-[#2d2e30] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#3c3c3f]">
                {feature.icon}
              </div>
              
              {/* 标题 */}
              <h3 
                className="text-[15px] font-semibold mb-2 transition-colors"
                style={{ color: feature.color }}
              >
                {feature.title}
              </h3>
              
              {/* 描述 */}
              <p className="text-[13px] text-[#6e6e73] leading-relaxed font-medium">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
