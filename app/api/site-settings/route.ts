import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// 禁用缓存，确保每次都获取最新设置
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 转换为对象格式
  const settings: Record<string, any> = {}
  data?.forEach((item) => {
    try {
      settings[item.key] = JSON.parse(item.value)
    } catch (e) {
      settings[item.key] = item.value
    }
  })

  // 添加禁止缓存的响应头
  return NextResponse.json(settings, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  })
}
