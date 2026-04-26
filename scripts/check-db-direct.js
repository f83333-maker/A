import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://pqwxxpekxupxhbakcfpi.supabase.co"
const supabaseKey = "sb_secret_MWdKIQOLHTeivTnvmiqX-w_HCjPxkjF"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log("=== 数据库检查开始 ===\n")

  // 1. 检查 visitors 表
  console.log("1. 检查访客记录表 (visitors)...")
  try {
    const { data: visitors, error: visitorsError } = await supabase
      .from("visitors")
      .select("*")
      .limit(5)
    
    if (visitorsError) {
      console.log("   访客表错误:", visitorsError.message)
    } else {
      console.log("   访客表正常，记录数:", visitors?.length || 0)
      if (visitors && visitors.length > 0) {
        console.log("   最近访客:", JSON.stringify(visitors[0], null, 2))
      }
    }
  } catch (e) {
    console.log("   访客表异常:", e.message)
  }

  // 2. 检查 orders 表
  console.log("\n2. 检查订单表 (orders)...")
  try {
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .limit(5)
    
    if (ordersError) {
      console.log("   订单表错误:", ordersError.message)
    } else {
      console.log("   订单表正常，记录数:", orders?.length || 0)
      if (orders && orders.length > 0) {
        console.log("   最近订单:", JSON.stringify(orders[0], null, 2))
      }
    }
  } catch (e) {
    console.log("   订单表异常:", e.message)
  }

  // 3. 检查 products 表
  console.log("\n3. 检查产品表 (products)...")
  try {
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, stock")
      .limit(3)
    
    if (productsError) {
      console.log("   产品表错误:", productsError.message)
    } else {
      console.log("   产品表正常，记录数:", products?.length || 0)
    }
  } catch (e) {
    console.log("   产品表异常:", e.message)
  }

  // 4. 检查 site_settings 表
  console.log("\n4. 检查网站设置表 (site_settings)...")
  try {
    const { data: settings, error: settingsError } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["contact_telegram", "contact_qq", "contact_email", "epay_api_url", "epay_pid"])
    
    if (settingsError) {
      console.log("   设置表错误:", settingsError.message)
    } else {
      console.log("   设置表正常，找到配置项:", settings?.length || 0)
      if (settings) {
        settings.forEach(s => {
          const val = s.value ? (s.value.length > 30 ? s.value.substring(0, 30) + "..." : s.value) : "(空)"
          console.log(`   - ${s.key}: ${val}`)
        })
      }
    }
  } catch (e) {
    console.log("   设置表异常:", e.message)
  }

  // 5. 检查支付相关设置
  console.log("\n5. 检查支付配置...")
  try {
    const { data: paySettings, error: payError } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["epay_api_url", "epay_pid", "epay_key"])
    
    if (payError) {
      console.log("   支付配置查询错误:", payError.message)
    } else {
      const epayUrl = paySettings?.find(s => s.key === "epay_api_url")?.value
      const epayPid = paySettings?.find(s => s.key === "epay_pid")?.value
      const epayKey = paySettings?.find(s => s.key === "epay_key")?.value
      
      console.log("   易支付API地址:", epayUrl || "(未配置)")
      console.log("   易支付商户ID:", epayPid || "(未配置)")
      console.log("   易支付密钥:", epayKey ? "已配置" : "(未配置)")
      
      if (!epayUrl || !epayPid || !epayKey) {
        console.log("   警告: 支付配置不完整，支付功能可能无法正常使用")
      }
    }
  } catch (e) {
    console.log("   支付配置检查异常:", e.message)
  }

  console.log("\n=== 数据库检查完成 ===")
}

checkDatabase().catch(console.error)
