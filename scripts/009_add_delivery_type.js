import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function addDeliveryType() {
  console.log("添加发货类型字段到products表...")

  // 添加delivery_type字段，默认为自动发货
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT '自动发货';
      
      -- 更新所有现有产品为自动发货
      UPDATE products SET delivery_type = '自动发货' WHERE delivery_type IS NULL;
    `
  })

  if (error) {
    // 如果rpc不可用，尝试直接更新
    console.log("使用备选方案更新...")
    
    // 先检查是否已有该字段
    const { data: products, error: checkError } = await supabase
      .from('products')
      .select('id, delivery_type')
      .limit(1)
    
    if (checkError && checkError.message.includes('delivery_type')) {
      console.log("字段不存在，请在Supabase SQL Editor中执行以下SQL:")
      console.log(`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT '自动发货';
        
        UPDATE products SET delivery_type = '自动发货' WHERE delivery_type IS NULL;
      `)
    } else {
      console.log("字段已存在或检查成功")
      
      // 更新所有产品为自动发货
      const { error: updateError } = await supabase
        .from('products')
        .update({ delivery_type: '自动发货' })
        .is('delivery_type', null)
      
      if (updateError) {
        console.log("更新失败:", updateError.message)
      } else {
        console.log("已将所有产品设置为自动发货")
      }
    }
  } else {
    console.log("字段添加成功")
  }
}

addDeliveryType()
