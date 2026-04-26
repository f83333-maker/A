import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://pqwxxpekxupxhbakcfpi.supabase.co"
const supabaseKey = "sb_secret_MWdKIQOLHTeivTnvmiqX-w_HCjPxkjF"

console.log("=== 检查 site_settings 表 ===\n")

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  // 1. 检查表中现有数据
  console.log("1. 检查现有设置数据...")
  const { data: settings, error: selectError } = await supabase
    .from("site_settings")
    .select("*")
  
  if (selectError) {
    console.error("   查询失败:", selectError.message)
  } else {
    console.log(`   现有设置数量: ${settings?.length || 0}`)
    if (settings && settings.length > 0) {
      settings.forEach(s => {
        console.log(`   - ${s.key}: ${s.value?.substring(0, 50)}...`)
      })
    }
  }

  // 2. 尝试插入测试数据
  console.log("\n2. 测试写入权限...")
  const testKey = "test_setting_" + Date.now()
  const { data: insertData, error: insertError } = await supabase
    .from("site_settings")
    .upsert({
      key: testKey,
      value: JSON.stringify("test_value"),
      updated_at: new Date().toISOString()
    }, { onConflict: "key" })
    .select()

  if (insertError) {
    console.error("   写入失败:", insertError.message)
    console.error("   错误详情:", insertError)
  } else {
    console.log("   写入成功!")
    
    // 验证写入
    const { data: verifyData } = await supabase
      .from("site_settings")
      .select("*")
      .eq("key", testKey)
      .single()
    
    if (verifyData) {
      console.log("   验证成功，数据已保存:", verifyData)
      
      // 清理测试数据
      await supabase.from("site_settings").delete().eq("key", testKey)
      console.log("   测试数据已清理")
    } else {
      console.log("   验证失败，数据未找到")
    }
  }

  // 3. 测试更新现有数据
  console.log("\n3. 测试更新已有设置...")
  const { error: updateError } = await supabase
    .from("site_settings")
    .upsert({
      key: "site_name",
      value: JSON.stringify("出海资源铺"),
      updated_at: new Date().toISOString()
    }, { onConflict: "key" })

  if (updateError) {
    console.error("   更新失败:", updateError.message)
  } else {
    console.log("   更新成功!")
    
    // 再次查询验证
    const { data: verifyUpdate } = await supabase
      .from("site_settings")
      .select("*")
      .eq("key", "site_name")
      .single()
    
    console.log("   更新后的数据:", verifyUpdate)
  }
}

main().catch(console.error)
