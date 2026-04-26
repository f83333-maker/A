import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log('[v0] Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProducts() {
  console.log('[v0] Checking Telegram products...')
  
  // 获取Telegram分类
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('id, name')
    .ilike('name', '%Telegram%')
    .single()
  
  if (catError) {
    console.log('[v0] Category error:', catError)
    return
  }
  
  console.log('[v0] Found category:', category)
  
  // 获取该分类下的产品
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name, icon_url')
    .eq('category_id', category.id)
  
  if (prodError) {
    console.log('[v0] Products error:', prodError)
    return
  }
  
  console.log('[v0] Products count:', products.length)
  products.forEach(p => {
    console.log(`[v0] - ${p.name.substring(0, 40)}... | icon_url: ${p.icon_url || 'NULL'}`)
  })
}

checkProducts()
