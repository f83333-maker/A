import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('=== 数据库连接检查 ===')
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : '未设置')

if (!supabaseUrl || !supabaseKey) {
  console.error('错误: 环境变量未设置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log('\n=== 检查所有表 ===')
  
  // 查询所有公开表
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_tables')
    .single()
  
  if (tablesError) {
    console.log('无法通过 RPC 获取表列表，尝试直接查询各表...\n')
  }

  // 直接检查各个表
  const tablesToCheck = [
    'admins',
    'categories', 
    'products',
    'announcements',
    'features',
    'settings',
    'site_settings',
    'visitor_stats',
    'orders'
  ]

  for (const table of tablesToCheck) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`❌ ${table}: ${error.message}`)
    } else {
      console.log(`✓ ${table}: ${count} 条记录`)
    }
  }

  // 检查 orders 表的详细信息
  console.log('\n=== 检查 orders 表详细 ===')
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .limit(5)
  
  if (ordersError) {
    console.log('orders 表错误:', ordersError.message)
    console.log('错误代码:', ordersError.code)
    console.log('错误详情:', ordersError.details)
    console.log('错误提示:', ordersError.hint)
  } else {
    console.log('orders 表前5条数据:', JSON.stringify(orders, null, 2))
  }

  // 检查 RLS 策略 - 通过查询 pg_policies
  console.log('\n=== 检查数据库连接信息 ===')
  const { data: authUser, error: authError } = await supabase.auth.getUser()
  console.log('当前认证用户:', authUser?.user?.email || '匿名用户 (anon)')
  
  // 检查是否能访问 products 表的数据
  console.log('\n=== 检查 products 表数据 ===')
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, price')
    .limit(3)
  
  if (productsError) {
    console.log('products 表错误:', productsError.message)
  } else {
    console.log('products 表数据:', JSON.stringify(products, null, 2))
  }
}

checkDatabase().catch(console.error)
