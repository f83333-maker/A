import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// 获取所有模板
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("product_templates")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json([])
      }
      console.error("获取模板失败:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("获取模板异常:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// 创建新模板
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!body.name || !body.data) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("product_templates")
      .insert({ name: body.name, data: body.data })
      .select()
      .single()

    if (error) {
      console.error("保存模板失败:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("保存模板异常:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
