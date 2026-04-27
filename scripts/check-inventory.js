import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkInventory() {
  // 检查 inventory 表数据
  const { data: inventory, error: invError } = await supabase
    .from('inventory')
    .select('*')
    .limit(10);
  
  console.log('=== Inventory表数据 ===');
  console.log(JSON.stringify(inventory, null, 2));
  if (invError) console.log('Inventory错误:', invError);
  
  // 检查 products 表的 stock 字段
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name, stock')
    .limit(5);
  
  console.log('\n=== Products stock字段 ===');
  console.log(JSON.stringify(products, null, 2));
  if (prodError) console.log('Products错误:', prodError);
}

checkInventory();
