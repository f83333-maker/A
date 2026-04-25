"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Users, 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Loader2, 
  Calendar,
  Eye,
  Package
} from "lucide-react"

interface DailyStats {
  date: string
  visitors: number
  orders: number
  revenue: number
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<"7" | "30" | "90">("7")
  const [stats, setStats] = useState({
    todayVisitors: 0,
    totalVisitors: 0,
    todayOrders: 0,
    todayRevenue: 0,
    totalOrders: 0,
    totalRevenue: 0,
  })
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [topPages, setTopPages] = useState<{ page: string; count: number }[]>([])

  const supabase = createClient()

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      // 获取北京时间今天的起始时间
      const now = new Date()
      const beijingOffset = 8 * 60 * 60 * 1000
      const beijingNow = new Date(now.getTime() + beijingOffset)
      const todayStart = new Date(
        beijingNow.getFullYear(),
        beijingNow.getMonth(),
        beijingNow.getDate()
      )
      todayStart.setTime(todayStart.getTime() - beijingOffset)

      // 获取今日访客（去重）
      const { data: todayVisitorData } = await supabase
        .from("visitor_stats")
        .select("ip_address")
        .gte("visited_at", todayStart.toISOString())
      
      const todayUniqueIPs = new Set(todayVisitorData?.map(v => v.ip_address) || [])

      // 获取范围内的访客数据
      const daysAgo = parseInt(dateRange)
      const rangeStart = new Date(todayStart.getTime() - daysAgo * 24 * 60 * 60 * 1000)

      const { data: visitorData } = await supabase
        .from("visitor_stats")
        .select("ip_address, page_url, visited_at")
        .gte("visited_at", rangeStart.toISOString())

      const totalUniqueIPs = new Set(visitorData?.map(v => v.ip_address) || [])

      // 统计热门页面
      const pageCount: Record<string, number> = {}
      visitorData?.forEach(v => {
        const page = v.page_url || "/"
        pageCount[page] = (pageCount[page] || 0) + 1
      })
      const topPagesArray = Object.entries(pageCount)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // 获取今日订单
      const { data: todayOrderData } = await supabase
        .from("orders")
        .select("total_amount, status")
        .gte("created_at", todayStart.toISOString())
        .in("status", ["paid", "delivered"])

      const todayOrders = todayOrderData?.length || 0
      const todayRevenue = todayOrderData?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0

      // 获取范围内的订单数据
      const { data: orderData } = await supabase
        .from("orders")
        .select("total_amount, status, created_at")
        .gte("created_at", rangeStart.toISOString())
        .in("status", ["paid", "delivered"])

      const totalOrders = orderData?.length || 0
      const totalRevenue = orderData?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0

      // 计算每日统计
      const dailyMap: Record<string, DailyStats> = {}
      
      // 初始化每天
      for (let i = 0; i < daysAgo; i++) {
        const date = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split("T")[0]
        dailyMap[dateStr] = { date: dateStr, visitors: 0, orders: 0, revenue: 0 }
      }

      // 统计访客
      visitorData?.forEach(v => {
        const dateStr = new Date(v.visited_at).toISOString().split("T")[0]
        if (dailyMap[dateStr]) {
          dailyMap[dateStr].visitors++
        }
      })

      // 统计订单
      orderData?.forEach(o => {
        const dateStr = new Date(o.created_at).toISOString().split("T")[0]
        if (dailyMap[dateStr]) {
          dailyMap[dateStr].orders++
          dailyMap[dateStr].revenue += o.total_amount || 0
        }
      })

      setStats({
        todayVisitors: todayUniqueIPs.size,
        totalVisitors: totalUniqueIPs.size,
        todayOrders,
        todayRevenue,
        totalOrders,
        totalRevenue,
      })
      setDailyStats(Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)))
      setTopPages(topPagesArray)
    } catch (error) {
      console.error("获取统计失败:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#8ab4f8] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-[#e3e3e3]">数据统计</h1>
          <p className="text-[14px] text-[#9aa0a6] mt-1 font-medium">
            网站前端访问数据和销售统计
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#6e6e73]" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as "7" | "30" | "90")}
            className="px-3 py-2 bg-[#2d2e30] border border-[#3c3c3f] rounded-xl text-[13px] text-[#e3e3e3] focus:outline-none focus:border-[#8ab4f8]"
          >
            <option value="7">最近7天</option>
            <option value="30">最近30天</option>
            <option value="90">最近90天</option>
          </select>
        </div>
      </div>

      {/* 今日数据 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#c58af9]/20 to-[#c58af9]/5 rounded-xl border border-[#c58af9]/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#c58af9]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#c58af9]" />
            </div>
            <span className="text-[13px] text-[#9aa0a6] font-medium">今日访客</span>
          </div>
          <p className="text-[28px] font-bold text-[#c58af9]">{stats.todayVisitors}</p>
          <p className="text-[11px] text-[#6e6e73] mt-1">独立IP，12小时去重</p>
        </div>

        <div className="bg-gradient-to-br from-[#8ab4f8]/20 to-[#8ab4f8]/5 rounded-xl border border-[#8ab4f8]/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#8ab4f8]/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-[#8ab4f8]" />
            </div>
            <span className="text-[13px] text-[#9aa0a6] font-medium">今日订单</span>
          </div>
          <p className="text-[28px] font-bold text-[#8ab4f8]">{stats.todayOrders}</p>
        </div>

        <div className="bg-gradient-to-br from-[#81c995]/20 to-[#81c995]/5 rounded-xl border border-[#81c995]/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#81c995]/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#81c995]" />
            </div>
            <span className="text-[13px] text-[#9aa0a6] font-medium">今日销售额</span>
          </div>
          <p className="text-[28px] font-bold text-[#81c995]">¥{stats.todayRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-[#fdd663]/20 to-[#fdd663]/5 rounded-xl border border-[#fdd663]/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#fdd663]/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#fdd663]" />
            </div>
            <span className="text-[13px] text-[#9aa0a6] font-medium">{dateRange}天销售额</span>
          </div>
          <p className="text-[28px] font-bold text-[#fdd663]">¥{stats.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* 累计数据 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#c58af9]/10 flex items-center justify-center">
              <Eye className="w-6 h-6 text-[#c58af9]" />
            </div>
            <div>
              <p className="text-[13px] text-[#6e6e73] font-medium">{dateRange}天总访客</p>
              <p className="text-[24px] font-bold text-[#e3e3e3]">{stats.totalVisitors}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#8ab4f8]/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-[#8ab4f8]" />
            </div>
            <div>
              <p className="text-[13px] text-[#6e6e73] font-medium">{dateRange}天总订单</p>
              <p className="text-[24px] font-bold text-[#e3e3e3]">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#81c995]/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#81c995]" />
            </div>
            <div>
              <p className="text-[13px] text-[#6e6e73] font-medium">转化率</p>
              <p className="text-[24px] font-bold text-[#e3e3e3]">
                {stats.totalVisitors > 0 
                  ? ((stats.totalOrders / stats.totalVisitors) * 100).toFixed(1) 
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 每日趋势 */}
      <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#3c3c3f]">
          <h2 className="text-[16px] font-semibold text-[#e3e3e3]">每日数据趋势</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#3c3c3f]">
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6] uppercase">日期</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold text-[#9aa0a6] uppercase">访客数</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold text-[#9aa0a6] uppercase">订单数</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold text-[#9aa0a6] uppercase">销售额</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3c3c3f]">
              {dailyStats.slice(-7).reverse().map((day) => (
                <tr key={day.date} className="hover:bg-[#2d2e30]/50">
                  <td className="px-4 py-3 text-[13px] text-[#e3e3e3]">{day.date}</td>
                  <td className="px-4 py-3 text-[13px] text-[#c58af9] text-right">{day.visitors}</td>
                  <td className="px-4 py-3 text-[13px] text-[#8ab4f8] text-right">{day.orders}</td>
                  <td className="px-4 py-3 text-[13px] text-[#81c995] text-right">¥{day.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 热门页面 */}
      <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#3c3c3f]">
          <h2 className="text-[16px] font-semibold text-[#e3e3e3]">热门访问页面</h2>
        </div>
        <div className="divide-y divide-[#3c3c3f]">
          {topPages.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[14px] text-[#6e6e73]">暂无数据</p>
            </div>
          ) : (
            topPages.map((page, index) => (
              <div key={page.page} className="px-5 py-3 flex items-center gap-4">
                <div 
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[14px] ${
                    index === 0 
                      ? "bg-[#fdd663]/20 text-[#fdd663]" 
                      : index === 1 
                      ? "bg-[#9aa0a6]/20 text-[#9aa0a6]" 
                      : index === 2 
                      ? "bg-[#ee675c]/20 text-[#ee675c]" 
                      : "bg-[#3c3c3f] text-[#6e6e73]"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-mono text-[#e3e3e3]">{page.page}</p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-semibold text-[#c58af9]">{page.count}</p>
                  <p className="text-[11px] text-[#6e6e73]">访问次数</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
