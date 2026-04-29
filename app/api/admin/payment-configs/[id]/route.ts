import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

// 获取单个支付配置
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from("payment_configs")
      .select("*")
      .eq("id", id)
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("获取支付配置失败:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}

// 更新支付配置
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const body = await request.json()
    
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.type !== undefined) updateData.type = body.type
    if (body.api_url !== undefined) updateData.api_url = body.api_url
    if (body.merchant_id !== undefined) updateData.merchant_id = body.merchant_id
    if (body.merchant_key !== undefined) updateData.merchant_key = body.merchant_key
    if (body.extra_config !== undefined) updateData.extra_config = body.extra_config
    if (body.supported_methods !== undefined) updateData.supported_methods = body.supported_methods
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order
    
    const { data, error } = await supabase
      .from("payment_configs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("更新支付配置失败:", error)
    return NextResponse.json({ error: "更新失败" }, { status: 500 })
  }
}

// 删除支付配置
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from("payment_configs")
      .delete()
      .eq("id", id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除支付配置失败:", error)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
