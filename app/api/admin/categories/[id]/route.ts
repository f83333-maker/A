import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await request.json()

  // 只提取数据库中存在的字段，过滤掉 product_count 等计算字段
  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.description !== undefined) updateData.description = body.description
  if (body.color !== undefined) updateData.color = body.color
  if (body.logo_data !== undefined) updateData.logo_data = body.logo_data
  if (body.logo_bg_color !== undefined) updateData.logo_bg_color = body.logo_bg_color
  if (body.is_active !== undefined) updateData.is_active = body.is_active
  if (body.sort_order !== undefined) updateData.sort_order = body.sort_order
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from("categories")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("更新分类失败:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
