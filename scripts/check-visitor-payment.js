import { createClient } from "@supabase/supabase-js"

// 清理可能的换行符和特殊字符
function cleanEnv(val) {
  if (!val) return ""
  return val.replace(/[\n\r\$']/g, "").trim()
}

const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

console.log("Supabase URL:", supabaseUrl)
console.log("Supabase Key:", supabaseKey ? "已配置 (" + supabaseKey.substring(0, 10) + "...)" : "未配置")

if (!supabaseUrl || !supabaseKey) {
  console.error("缺少 Supabase 环境变量")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log("=== 检查访客记录功能 ===\n")
  
  // 检查 visitors 表
  const { data: visitors, error: visitorsError } = await supabase
    .from("visitors")
    .select("*")
    .limit(5)
  
  if (visitorsError) {
    console.log("❌ visitors 表查询失败:", visitorsError.message)
  } else {
    console.log("✅ visitors 表存在，记录数:", visitors.length)
    if (visitors.length > 0) {
      console.log("   最近访客示例:", JSON.stringify(visitors[0], null, 2))
    }
  }

  // 检查 visitor_stats 表
  const { data: stats, error: statsError } = await supabase
    .from("visitor_stats")
    .select("*")
    .limit(5)
  
  if (statsError) {
    console.log("❌ visitor_stats 表查询失败:", statsError.message)
  } else {
    console.log("✅ visitor_stats 表存在，记录数:", stats.length)
    if (stats.length > 0) {
      console.log("   统计示例:", JSON.stringify(stats[0], null, 2))
    }
  }

  console.log("\n=== 检查支付系统功能 ===\n")

  // 检查 orders 表
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)
  
  if (ordersError) {
    console.log("❌ orders 表查询失败:", ordersError.message)
  } else {
    console.log("✅ orders 表存在，记录数:", orders.length)
    if (orders.length > 0) {
      console.log("   最近订单示例:")
      orders.forEach((order, i) => {
        console.log(`   ${i + 1}. 订单号: ${order.order_no}, 状态: ${order.status}, 金额: ¥${order.total_amount}`)
      })
    }
  }

  // 检查 payments 表
  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)
  
  if (paymentsError) {
    console.log("❌ payments 表查询失败:", paymentsError.message)
  } else {
    console.log("✅ payments 表存在，记录数:", payments.length)
    if (payments.length > 0) {
      console.log("   最近支付记录:")
      payments.forEach((p, i) => {
        console.log(`   ${i + 1}. 订单: ${p.order_id}, 方式: ${p.payment_method}, 状态: ${p.status}`)
      })
    }
  }

  // 检查 site_settings 表中的支付配置
  const { data: settings, error: settingsError } = await supabase
    .from("site_settings")
    .select("*")
    .in("key", ["epay_url", "epay_pid", "epay_key", "payment_wechat_enabled", "payment_alipay_enabled"])
  
  if (settingsError) {
    console.log("❌ 支付配置查询失败:", settingsError.message)
  } else {
    console.log("\n✅ 支付配置:")
    settings.forEach(s => {
      const value = s.key.includes("key") ? "***已设置***" : (s.value || "未设置")
      console.log(`   ${s.key}: ${value}`)
    })
  }

  // 检查产品表
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, stock")
    .limit(3)
  
  if (productsError) {
    console.log("\n❌ products 表查询失败:", productsError.message)
  } else {
    console.log("\n✅ products 表存在，示例产品:")
    products.forEach(p => {
      console.log(`   - ${p.name}: ¥${p.price}, 库存: ${p.stock}`)
    })
  }

  // 检查库存表
  const { data: inventory, error: inventoryError } = await supabase
    .from("inventory")
    .select("id, product_id, status")
    .limit(5)
  
  if (inventoryError) {
    console.log("\n❌ inventory 表查询失败:", inventoryError.message)
  } else {
    console.log("\n✅ inventory 表存在，记录数:", inventory.length)
    const available = inventory.filter(i => i.status === "available").length
    const sold = inventory.filter(i => i.status === "sold").length
    console.log(`   可用: ${available}, 已售: ${sold}`)
  }

  console.log("\n=== 检查完成 ===")
}

checkDatabase().catch(console.error)
