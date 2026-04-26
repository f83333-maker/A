import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function removeEmojis() {
  console.log('[v0] Removing emojis from product names...')
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name')
  
  if (error) {
    console.error('[v0] Error fetching products:', error)
    return
  }
  
  // 匹配国旗emoji和其他常见emoji
  const emojiRegex = /^[\u{1F1E0}-\u{1F1FF}]{2}\s*|^[\u{1F300}-\u{1F9FF}]\s*|^🌍\s*/gu
  
  for (const product of products) {
    const cleanName = product.name.replace(emojiRegex, '').trim()
    
    if (cleanName !== product.name) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ name: cleanName })
        .eq('id', product.id)
      
      if (updateError) {
        console.error(`[v0] Error updating ${product.name}:`, updateError)
      } else {
        console.log(`[v0] Cleaned: "${product.name}" -> "${cleanName}"`)
      }
    }
  }
  
  console.log('[v0] Done!')
}

removeEmojis()
