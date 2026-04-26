import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateSettings() {
  console.log("正在更新网站设置...")

  // 更新 banner_title
  const { error: error1 } = await supabase
    .from("site_settings")
    .upsert({ key: "banner_title", value: "跨境资源铺" }, { onConflict: "key" })
  
  if (error1) {
    console.error("更新 banner_title 失败:", error1)
  } else {
    console.log("banner_title 已更新为: 跨境资源铺")
  }

  // 更新 banner_subtitle
  const { error: error2 } = await supabase
    .from("site_settings")
    .upsert({ key: "banner_subtitle", value: "一站式跨境资源采购平台，助力全球化业务拓展" }, { onConflict: "key" })
  
  if (error2) {
    console.error("更新 banner_subtitle 失败:", error2)
  } else {
    console.log("banner_subtitle 已更新为: 一站式跨境资源采购平台，助力全球化业务拓展")
  }

  // 更新热门搜索标签
  const { error: error3 } = await supabase
    .from("site_settings")
    .upsert({ key: "hot_search_tags", value: JSON.stringify(["社交媒体", "海外邮箱", "营销工具", "出海必备"]) }, { onConflict: "key" })
  
  if (error3) {
    console.error("更新 hot_search_tags 失败:", error3)
  } else {
    console.log("hot_search_tags 已更新")
  }

  console.log("设置更新完成!")
}

updateSettings()
