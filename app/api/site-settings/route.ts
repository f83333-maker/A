import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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

  return NextResponse.json(settings)
}
