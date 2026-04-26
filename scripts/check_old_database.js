const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pqwxxpekxupxhbakcfpi.supabase.co'
const supabaseKey = 'sb_secret_MWdKIQOLHTeivTnvmiqX-w_HCjPxkjF'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log('=== 检查旧 Supabase 数据库 ===')
  console.log('URL:', supabaseUrl)
  console.log('')

  const tables = [
    'admins',
    'categories', 
    'products',
    'announcements',
    'features',
    'settings',
    'site_settings',
    'orders',
    'visitor_stats'
  ]

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(5)

      if (error) {
        console.log(`❌ ${table}: 错误 - ${error.message}`)
      } else {
        console.log(`✅ ${table}: ${data.length} 条记录 (显示前5条)`)
        if (data.length > 0) {
          console.log(`   字段: ${Object.keys(data[0]).join(', ')}`)
        }
      }
    } catch (e) {
      console.log(`❌ ${table}: 异常 - ${e.message}`)
    }
  }

  // 详细检查 orders 表
  console.log('\n=== 详细检查 orders 表 ===')
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .limit(3)
  
  if (ordersError) {
    console.log('orders 表错误:', ordersError.message)
  } else {
    console.log('orders 记录数:', orders.length)
    if (orders.length > 0) {
      console.log('示例订单:', JSON.stringify(orders[0], null, 2))
    }
  }
}

checkDatabase().catch(console.error)
