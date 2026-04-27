import { createClient } from "@/lib/supabase/server"
import { Package, TrendingUp, ShoppingCart, DollarSign, Wallet, Clock, CheckCircle, XCircle, Users } from "lucide-react"
import Link from "next/link"

async function getStats() {
  const supabase = await createClient()
  
  const [products, orders] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
  ])

  // 获取产品数据用于计算销售额和利润
  const { data: productData } = await supabase
    .from("products")
    .select("price, cost_price, sales, stock")
  
  const totalSales = productData?.reduce((sum, p) => sum + (p.sales || 0), 0) || 0
  const totalStock = productData?.reduce((sum, p) => sum + (p.stock || 0), 0) || 0
  
  // 计算总销售额和总利润
  const totalRevenue = productData?.reduce((sum, p) => sum + ((p.price || 0) * (p.sales || 0)), 0) || 0
  const totalProfit = productData?.reduce((sum, p) => sum + (((p.price || 0) - (p.cost_price || 0)) * (p.sales || 0)), 0) || 0

  return {
    products: products.count || 0,
    orders: orders.count || 0,
    totalSales,
    totalStock,
    totalRevenue,
    totalProfit,
  }
}

async function getTodayVisitors() {
  const supabase = await createClient()
  
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
  
  // 统计今日独立IP数
  const { data } = await supabase
    .from("visitor_stats")
    .select("ip_address")
    .gte("visited_at", todayStart.toISOString())
  
  // 去重计数
  const uniqueIPs = new Set(data?.map(v => v.ip_address) || [])
  
  return uniqueIPs.size
}

async function getTopSellingProducts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("products")
    .select("*, categories(name)")
    .order("sales", { ascending: false })
    .limit(5)
  return data || []
}

async function getRecentOrders() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)  // 只显示5条
  return data || []
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; text: string }> = {
  pending: { icon: Clock, color: "#fdd663", text: "待支付" },
  paid: { icon: CheckCircle, color: "#81c995", text: "已支付" },
  delivered: { icon: Package, color: "#7CFF00", text: "已发放" },
  cancelled: { icon: XCircle, color: "#ee675c", text: "已取消" },
  refunded: { icon: XCircle, color: "#9aa0a6", text: "已退款" },
}

export default async function AdminDashboard() {
  const stats = await getStats()
  const todayVisitors = await getTodayVisitors()
  const topSellingProducts = await getTopSellingProducts()
  const recentOrders = await getRecentOrders()

  const statCards = [
    { 
      name: "今日访客", 
      value: todayVisitors, 
      icon: Users, 
      color: "#c58af9",
      href: "/admin/analytics"
    },
    { 
      name: "产品总数", 
      value: stats.products, 
      icon: Package, 
      color: "#81c995",
      href: "/admin/products"
    },
    { 
      name: "订单总数", 
      value: stats.orders, 
      icon: ShoppingCart, 
      color: "#7CFF00",
      href: "/admin/orders"
    },
    { 
      name: "总销量", 
      value: stats.totalSales, 
      icon: TrendingUp, 
      color: "#fdd663",
      href: "/admin/products"
    },
    { 
      name: "总库存", 
      value: stats.totalStock, 
      icon: Package, 
      color: "#fdd663",
      href: "/admin/products"
    },
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-[24px] font-semibold text-[#e3e3e3]">仪表盘</h1>
        <p className="text-[14px] text-[#9aa0a6] mt-1 font-medium">
          欢迎回来，这里是您的数据概览
        </p>
      </div>

      {/* 统计卡片 - 紧凑版 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] p-3 hover:border-[#5f6368] transition-all duration-200 group"
          >
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <p className="text-[12px] text-[#6e6e73] font-semibold">{stat.name}</p>
            </div>
            <p className="text-[20px] font-semibold text-[#e3e3e3] group-hover:text-white transition-colors">
              {stat.value}
            </p>
          </Link>
        ))}
        {/* 总销售额 */}
        <Link href="/admin/orders" className="bg-[#1e1f20] rounded-xl border border-[#7CFF00]/30 p-3 hover:border-[#7CFF00]/50 transition-all duration-200 group">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#7CFF00]/15 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#7CFF00]" />
            </div>
            <p className="text-[12px] text-[#6e6e73] font-semibold">总销售额</p>
          </div>
          <p className="text-[18px] font-bold text-[#7CFF00]">¥{stats.totalRevenue.toFixed(0)}</p>
        </Link>
        {/* 总利润 */}
        <Link href="/admin/orders" className="bg-[#1e1f20] rounded-xl border border-[#81c995]/30 p-3 hover:border-[#81c995]/50 transition-all duration-200 group">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#81c995]/15 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#81c995]" />
            </div>
            <p className="text-[12px] text-[#6e6e73] font-semibold">总利润</p>
          </div>
          <p className="text-[18px] font-bold text-[#81c995]">¥{stats.totalProfit.toFixed(0)}</p>
        </Link>
      </div>

      {/* 最近订单 */}
      <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#3c3c3f] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#7CFF00]" />
            <h2 className="text-[16px] font-semibold text-[#e3e3e3]">最近订单</h2>
            <span className="text-[12px] text-[#6e6e73] ml-2">最新5条</span>
          </div>
          <Link 
            href="/admin/orders"
            className="text-[13px] text-[#7CFF00] hover:text-[#9FFF40] font-medium transition-colors"
          >
            查看全部
          </Link>
        </div>
        <div className="divide-y divide-[#3c3c3f]">
          {recentOrders.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[14px] text-[#6e6e73] font-medium">暂无订单数据</p>
            </div>
          ) : (
            recentOrders.map((order: {
              id: string
              order_no: string
              product_name: string
              total_amount: number
              status: string
              created_at: string
            }) => {
              const status = statusConfig[order.status] || statusConfig.pending
              const StatusIcon = status.icon
              return (
                <div key={order.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-mono text-[#9aa0a6]">{order.order_no}</p>
                    <p className="text-[14px] font-medium text-[#e3e3e3] truncate">{order.product_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-semibold text-[#7CFF00]">¥{order.total_amount}</p>
                    <p className="text-[11px] text-[#6e6e73]">
                      {new Date(order.created_at).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium"
                    style={{ backgroundColor: `${status.color}15`, color: status.color }}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {status.text}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 销售产品排行榜 */}
      <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#3c3c3f] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#fdd663]" />
            <h2 className="text-[16px] font-semibold text-[#e3e3e3]">销售产品排行榜</h2>
          </div>
          <Link 
            href="/admin/products"
            className="text-[13px] text-[#7CFF00] hover:text-[#9FFF40] font-medium transition-colors"
          >
            查看全部
          </Link>
        </div>
        <div className="divide-y divide-[#3c3c3f]">
          {topSellingProducts.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[14px] text-[#6e6e73] font-medium">暂无销售数据</p>
            </div>
          ) : (
            topSellingProducts.map((product: {
              id: string
              name: string
              price: number
              cost_price: number
              sales: number
              stock: number
              categories: { name: string } | null
            }, index: number) => (
              <div key={product.id} className="px-5 py-3 flex items-center gap-4">
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
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#e3e3e3] truncate">{product.name}</p>
                  <p className="text-[12px] text-[#6e6e73] font-semibold">{product.categories?.name || "未分类"}</p>
                </div>
                <div className="text-center px-3">
                  <p className="text-[16px] font-bold text-[#81c995]">{product.sales}</p>
                  <p className="text-[11px] text-[#6e6e73] font-semibold">销量</p>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="text-[14px] font-semibold text-[#7CFF00]">¥{(product.price * product.sales).toFixed(2)}</p>
                  <p className="text-[11px] text-[#6e6e73] font-semibold">销售额</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
