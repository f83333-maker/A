import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://pqwxxpekxupxhbakcfpi.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || ""

console.log("=== 数据库检查脚本 ===\n")

if (!supabaseKey) {
  console.error("缺少 Supabase API Key")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  // 1. 检查 visitor_logs 表
  console.log("1. 检查访客记录表 (visitor_logs)...")
  try {
    const { data: visitors, error: visitorError } = await supabase
      .from("visitor_logs")
      .select("*")
      .limit(5)
    
    if (visitorError) {
      console.log("   ❌ 访客记录表错误:", visitorError.message)
    } else {
      console.log("   ✅ 访客记录表正常，记录数:", visitors?.length || 0)
      if (visitors && visitors.length > 0) {
        console.log("   最近访客:", JSON.stringify(visitors[0], null, 2))
      }
    }
  } catch (e) {
    console.log("   ❌ 异常:", e.message)
  }

  // 2. 检查 orders 表
  console.log("\n2. 检查订单表 (orders)...")
  try {
    const { data: orders, error: orderError } = await supabase
      .from("orders")
      .select("id, order_no, status, payment_method, total_amount, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
    
    if (orderError) {
      console.log("   ❌ 订单表错误:", orderError.message)
    } else {
      console.log("   ✅ 订单表正常，记录数:", orders?.length || 0)
      if (orders && orders.length > 0) {
        console.log("   最近订单:")
        orders.forEach(o => {
          console.log(`     - ${o.order_no} | ${o.status} | ${o.payment_method} | ¥${o.total_amount}`)
        })
      }
    }
  } catch (e) {
    console.log("   ❌ 异常:", e.message)
  }

  // 3. 检查支付设置
  console.log("\n3. 检查支付设置 (site_settings)...")
  try {
    const { data: settings, error: settingsError } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["epay_url", "epay_pid", "epay_key", "payment_wechat_enabled", "payment_alipay_enabled"])
    
    if (settingsError) {
      console.log("   ❌ 设置表错误:", settingsError.message)
    } else {
      console.log("   ✅ 支付设置:")
      if (settings && settings.length > 0) {
        settings.forEach(s => {
          const val = s.key.includes("key") ? "***已配置***" : (s.value || "未设置")
          console.log(`     - ${s.key}: ${val}`)
        })
      } else {
        console.log("     未找到支付设置")
      }
    }
  } catch (e) {
    console.log("   ❌ 异常:", e.message)
  }

  // 4. 检查产品和库存
  console.log("\n4. 检查产品库存...")
  try {
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id, name, stock, price")
      .limit(3)
    
    if (productError) {
      console.log("   ❌ 产品表错误:", productError.message)
    } else {
      console.log("   ✅ 产品表正常，示例产品:")
      if (products && products.length > 0) {
        products.forEach(p => {
          console.log(`     - ${p.name} | 库存: ${p.stock} | ¥${p.price}`)
        })
      }
    }
  } catch (e) {
    console.log("   ❌ 异常:", e.message)
  }

  // 5. 检查库存卡密
  console.log("\n5. 检查库存卡密 (inventory)...")
  try {
    const { data: inventory, error: invError } = await supabase
      .from("inventory")
      .select("id, product_id, status")
      .limit(10)
    
    if (invError) {
      console.log("   ❌ 库存表错误:", invError.message)
    } else {
      const available = inventory?.filter(i => i.status === "available").length || 0
      const sold = inventory?.filter(i => i.status === "sold").length || 0
      console.log(`   ✅ 库存表正常，可用: ${available}, 已售: ${sold}`)
    }
  } catch (e) {
    console.log("   ❌ 异常:", e.message)
  }

  console.log("\n=== 检查完成 ===")
}

checkDatabase()
