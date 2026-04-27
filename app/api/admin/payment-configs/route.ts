import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// 获取所有支付配置
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("payment_configs")
      .select("*")
      .order("sort_order", { ascending: true })
    
    if (error) throw error
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("获取支付配置失败:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}

// 创建新支付配置
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from("payment_configs")
      .insert({
        name: body.name,
        type: body.type || "epay",
        api_url: body.api_url,
        merchant_id: body.merchant_id,
        merchant_key: body.merchant_key,
        extra_config: body.extra_config || {},
        supported_methods: body.supported_methods || ["wxpay", "alipay"],
        is_active: body.is_active ?? true,
        sort_order: body.sort_order || 0,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("创建支付配置失败:", error)
    return NextResponse.json({ error: "创建失败" }, { status: 500 })
  }
}
