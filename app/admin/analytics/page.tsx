"use client"

import { useState, useEffect } from "react"
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Loader2,
  Eye,
  X,
  Smartphone,
  Monitor,
  Package,
  ExternalLink,
  TrendingUp,
  MapPin,
  Clock
} from "lucide-react"

interface Visitor {
  id: string
  ip_address: string
  ip_location: string | null
  device_type: string | null
  device_info: string | null
  user_agent: string
  page_url: string
  viewed_products: string[] | null
  order_no: string | null
  visited_at: string
  session_id: string | null
}

interface ProductInfo {
  id: string
  name: string
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    todayVisitors: 0,
    todayOrders: 0,
    todayRevenue: 0,
    todayProfit: 0,
  })
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [products, setProducts] = useState<ProductInfo[]>([])

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/analytics")
      const data = await res.json()
      
      if (res.ok) {
        setStats(data.stats)
        setVisitors(data.visitors || [])
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error("获取分析数据失败:", error)
    } finally {
      setLoading(false)
    }
  }

  // 获取产品名称
  function getProductName(productId: string): string {
    const product = products.find(p => p.id === productId)
    return product?.name || productId
  }

  // 获取设备图标
  function getDeviceIcon(deviceType: string | null) {
    if (!deviceType) return <Monitor className="w-4 h-4" />
    const type = deviceType.toLowerCase()
    if (type.includes("phone") || type.includes("iphone") || type.includes("android")) {
      return <Smartphone className="w-4 h-4" />
    }
    return <Monitor className="w-4 h-4" />
  }

  // 打开访客详情弹窗
  function openVisitorDetail(visitor: Visitor) {
    setSelectedVisitor(visitor)
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#7CFF00] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-[24px] font-semibold text-[#e3e3e3]">数据统计</h1>
        <p className="text-[14px] text-[#9aa0a6] mt-1 font-medium">
          实时网站访问和销售数据
        </p>
      </div>

      {/* 今日数据仪表盘 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#c58af9]/20 to-[#c58af9]/5 rounded-xl border border-[#c58af9]/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#c58af9]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#c58af9]" />
            </div>
            <span className="text-[13px] text-[#9aa0a6] font-medium">访客数量</span>
          </div>
          <p className="text-[28px] font-bold text-[#c58af9]">{stats.todayVisitors}</p>
          <p className="text-[11px] text-[#6e6e73] mt-1">今日独立IP</p>
        </div>

        <div className="bg-gradient-to-br from-[#7CFF00]/20 to-[#7CFF00]/5 rounded-xl border border-[#7CFF00]/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#7CFF00]/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-[#7CFF00]" />
            </div>
            <span className="text-[13px] text-[#9aa0a6] font-medium">今日订单</span>
          </div>
          <p className="text-[28px] font-bold text-[#7CFF00]">{stats.todayOrders}</p>
          <p className="text-[11px] text-[#6e6e73] mt-1">已支付/已发放</p>
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
            <span className="text-[13px] text-[#9aa0a6] font-medium">今日利润</span>
          </div>
          <p className="text-[28px] font-bold text-[#fdd663]">¥{stats.todayProfit.toFixed(2)}</p>
        </div>
      </div>

      {/* 访客详情列表 */}
      <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#3c3c3f] flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#e3e3e3]">今日访客详情</h2>
          <span className="text-[13px] text-[#6e6e73]">共 {visitors.length} 位访客</span>
        </div>
        
        {visitors.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Users className="w-12 h-12 text-[#3c3c3f] mx-auto mb-3" />
            <p className="text-[14px] text-[#6e6e73]">今日暂无访客</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#3c3c3f]">
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6] uppercase">序号</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6] uppercase">IP地址</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6] uppercase">地区</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6] uppercase">设备</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#9aa0a6] uppercase">访问时间</th>
                  <th className="px-4 py-3 text-center text-[12px] font-semibold text-[#9aa0a6] uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3c3c3f]">
                {visitors.map((visitor, index) => (
                  <tr key={visitor.id} className="hover:bg-[#2d2e30]/50">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#c58af9]/20 text-[#c58af9] font-bold text-[13px]">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-mono text-[#e3e3e3]">{visitor.ip_address}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#6e6e73]" />
                        <span className="text-[13px] text-[#9aa0a6]">{visitor.ip_location || "未知"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(visitor.device_type)}
                        <span className="text-[13px] text-[#9aa0a6]">{visitor.device_type || "未知"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#6e6e73]" />
                        <span className="text-[13px] text-[#9aa0a6]">
                          {new Date(visitor.visited_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openVisitorDetail(visitor)}
                        className="px-3 py-1.5 bg-[#7CFF00]/10 hover:bg-[#7CFF00]/20 text-[#7CFF00] rounded-lg text-[12px] font-medium transition-colors"
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 访客详情弹窗 */}
      {isModalOpen && selectedVisitor && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e1f20] rounded-2xl border border-[#3c3c3f] w-full max-w-lg max-h-[90vh] overflow-hidden">
            {/* 弹窗头部 */}
            <div className="px-6 py-4 border-b border-[#3c3c3f] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#c58af9]/20 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-[#c58af9]" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-[#e3e3e3]">访客详情</h3>
                  <p className="text-[12px] text-[#6e6e73]">
                    编号 #{visitors.findIndex(v => v.id === selectedVisitor.id) + 1}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-[#3c3c3f] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#9aa0a6]" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* IP地址和位置 */}
              <div className="bg-[#2d2e30] rounded-xl p-4">
                <label className="text-[12px] text-[#6e6e73] font-medium">IP地址</label>
                <p className="text-[15px] font-mono text-[#e3e3e3] mt-1">{selectedVisitor.ip_address}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <MapPin className="w-4 h-4 text-[#7CFF00]" />
                  <span className="text-[13px] text-[#9aa0a6]">{selectedVisitor.ip_location || "未知"}</span>
                </div>
              </div>

              {/* 设备信息 */}
              <div className="bg-[#2d2e30] rounded-xl p-4">
                <label className="text-[12px] text-[#6e6e73] font-medium">访客设备</label>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-10 h-10 rounded-lg bg-[#7CFF00]/10 flex items-center justify-center">
                    {getDeviceIcon(selectedVisitor.device_type)}
                  </div>
                  <div>
                    <p className="text-[14px] text-[#e3e3e3] font-medium">{selectedVisitor.device_type || "未知设备"}</p>
                    <p className="text-[12px] text-[#6e6e73]">{selectedVisitor.device_info || "未知系统"}</p>
                  </div>
                </div>
              </div>

              {/* 浏览的商品 */}
              <div className="bg-[#2d2e30] rounded-xl p-4">
                <label className="text-[12px] text-[#6e6e73] font-medium">浏览商品</label>
                {selectedVisitor.viewed_products && selectedVisitor.viewed_products.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {selectedVisitor.viewed_products.map((productId, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-[#1e1f20] rounded-lg">
                        <Package className="w-4 h-4 text-[#81c995]" />
                        <span className="text-[13px] text-[#e3e3e3]">{getProductName(productId)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#6e6e73] mt-2">暂无浏览记录</p>
                )}
              </div>

              {/* 订单信息 */}
              {selectedVisitor.order_no && (
                <div className="bg-gradient-to-r from-[#81c995]/10 to-transparent rounded-xl p-4 border border-[#81c995]/30">
                  <label className="text-[12px] text-[#81c995] font-medium">已下单</label>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[15px] font-mono text-[#e3e3e3]">{selectedVisitor.order_no}</p>
                    <a
                      href={`/admin/orders?search=${selectedVisitor.order_no}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#81c995]/20 hover:bg-[#81c995]/30 text-[#81c995] rounded-lg text-[12px] font-medium transition-colors"
                    >
                      查看订单
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* 访问时间 */}
              <div className="bg-[#2d2e30] rounded-xl p-4">
                <label className="text-[12px] text-[#6e6e73] font-medium">访问时间</label>
                <p className="text-[14px] text-[#e3e3e3] mt-1">
                  {new Date(selectedVisitor.visited_at).toLocaleString("zh-CN")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
