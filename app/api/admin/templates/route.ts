import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// 使用 Service Role Key 创建管理员客户端
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// 获取所有模板
export async function GET() {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from("product_templates")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      // 如果表不存在，返回空数组
      if (error.code === "42P01") {
        return NextResponse.json([])
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// 创建新模板
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("product_templates")
      .insert({
        name: body.name,
        data: body.data,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
