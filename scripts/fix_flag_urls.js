import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixFlagUrls() {
  console.log('[v0] Fixing flag URLs...')
  
  // 获取所有有icon_url的产品
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, icon_url')
    .not('icon_url', 'is', null)
  
  if (error) {
    console.log('[v0] Error:', error.message)
    return
  }
  
  console.log('[v0] Found', products.length, 'products with icon_url')
  
  for (const product of products) {
    // 将 w64 替换为 w40
    const newUrl = product.icon_url.replace('/w64/', '/w40/')
    
    const { error: updateError } = await supabase
      .from('products')
      .update({ icon_url: newUrl })
      .eq('id', product.id)
    
    if (updateError) {
      console.log('[v0] Failed to update', product.name, ':', updateError.message)
    } else {
      console.log('[v0] Updated:', product.name.substring(0, 30), '-> ', newUrl)
    }
  }
  
  console.log('[v0] Done!')
}

fixFlagUrls()
