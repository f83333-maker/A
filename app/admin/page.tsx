import { createClient } from "@/lib/supabase/server"
import { Package, TrendingUp, ShoppingCart, DollarSign, Wallet, Clock, CheckCircle, XCircle } from "lucide-react"
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

async function getTopSellingProducts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("products")
    .select("*, categories(name)")
    .order("sales", { ascending: false })
    .limit(10)
  return data || []
}

async function getRecentOrders() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)
  return data || []
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; text: string }> = {
  pending: { icon: Clock, color: "#fdd663", text: "待支付" },
  paid: { icon: CheckCircle, color: "#81c995", text: "已支付" },
  delivered: { icon: Package, color: "#8ab4f8", text: "已发放" },
  cancelled: { icon: XCircle, color: "#ee675c", text: "已取消" },
  refunded: { icon: XCircle, color: "#9aa0a6", text: "已退款" },
}

export default async function AdminDashboard() {
  const stats = await getStats()
  const topSellingProducts = await getTopSellingProducts()
  const recentOrders = await getRecentOrders()

  const statCards = [
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
      color: "#8ab4f8",
      href: "/admin/orders"
    },
    { 
      name: "总销量", 
      value: stats.totalSales, 
      icon: TrendingUp, 
      color: "#af87c9",
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

      {/* 销售额与利润统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#8ab4f8]/20 to-[#8ab4f8]/5 rounded-xl border border-[#8ab4f8]/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#8ab4f8]/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#8ab4f8]" />
            </div>
            <span className="text-[13px] text-[#9aa0a6] font-medium">今日销售额</span>
          </div>
          <p className="text-[28px] font-bold text-[#8ab4f8]">
            ¥{stats.totalRevenue.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-[#81c995]/20 to-[#81c995]/5 rounded-xl border border-[#81c995]/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#81c995]/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#81c995]" />
            </div>
            <span className="text-[13px] text-[#9aa0a6] font-medium">今日利润</span>
          </div>
          <p className="text-[28px] font-bold text-[#81c995]">
            ¥{stats.totalProfit.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-[#fdd663]/20 to-[#fdd663]/5 rounded-xl border border-[#fdd663]/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#fdd663]/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#fdd663]" />
            </div>
            <span className="text-[13px] text-[#9aa0a6] font-medium">本月销售额</span>
          </div>
          <p className="text-[28px] font-bold text-[#fdd663]">
            ¥{stats.totalRevenue.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-[#ee675c]/20 to-[#ee675c]/5 rounded-xl border border-[#ee675c]/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#ee675c]/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#ee675c]" />
            </div>
            <span className="text-[13px] text-[#9aa0a6] font-medium">本月利润</span>
          </div>
          <p className="text-[28px] font-bold text-[#ee675c]">
            ¥{stats.totalProfit.toFixed(2)}
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] p-4 hover:border-[#5f6368] transition-all duration-200 group"
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${stat.color}15` }}
            >
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
            </div>
            <p className="text-[24px] font-semibold text-[#e3e3e3] group-hover:text-white transition-colors">
              {stat.value}
            </p>
            <p className="text-[13px] text-[#6e6e73] font-medium mt-1">
              {stat.name}
            </p>
          </Link>
        ))}
      </div>

      {/* 最近订单 */}
      <div className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#3c3c3f] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#8ab4f8]" />
            <h2 className="text-[16px] font-semibold text-[#e3e3e3]">最近订单</h2>
          </div>
          <Link 
            href="/admin/orders"
            className="text-[13px] text-[#8ab4f8] hover:text-[#aecbfa] font-medium transition-colors"
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
                    <p className="text-[14px] font-semibold text-[#8ab4f8]">¥{order.total_amount}</p>
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
            className="text-[13px] text-[#8ab4f8] hover:text-[#aecbfa] font-medium transition-colors"
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
                  <p className="text-[12px] text-[#6e6e73] font-medium">{product.categories?.name || "未分类"}</p>
                </div>
                <div className="text-center px-3">
                  <p className="text-[16px] font-bold text-[#81c995]">{product.sales}</p>
                  <p className="text-[11px] text-[#6e6e73] font-medium">销量</p>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="text-[14px] font-semibold text-[#8ab4f8]">¥{(product.price * product.sales).toFixed(2)}</p>
                  <p className="text-[11px] text-[#6e6e73] font-medium">销售额</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
