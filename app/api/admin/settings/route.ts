import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// 获取所有设置
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")

    if (error) {
      console.error("[v0] 获取设置失败:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] 获取设置异常:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

// 保存设置
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { settings } = body as { settings: { key: string; value: any }[] }

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: "无效的请求数据" }, { status: 400 })
    }

    const supabase = await createClient()

    for (const setting of settings) {
      const { error } = await supabase
        .from("site_settings")
        .upsert({
          key: setting.key,
          value: JSON.stringify(setting.value),
          updated_at: new Date().toISOString()
        }, { onConflict: "key" })

      if (error) {
        console.error("[v0] 保存设置失败:", setting.key, error)
        return NextResponse.json({ error: error.message, key: setting.key }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] 保存设置异常:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
