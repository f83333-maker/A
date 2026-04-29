import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("products")
    .update(body)
    .eq("id", id)
    .select()
    .single()

  if (error) {
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

  console.log(`[v0] 删除产品: ${id}`)

  // 权限验证：确保只有管理员可以删除产品
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error(`[v0] 未授权的删除请求: 用户未登录`)
    return NextResponse.json(
      { error: "未授权：用户未登录" },
      { status: 401 }
    )
  }

  // 检查用户是否为管理员
  const isAdmin = user.user_metadata?.is_admin === true
  if (!isAdmin) {
    console.warn(`[v0] 权限不足: 用户 ${user.id} 尝试删除产品`)
    return NextResponse.json(
      { error: "权限不足：只有管理员才能删除产品" },
      { status: 403 }
    )
  }

  // 先删除相关的订单（处理外键约束）
  const { error: ordersError } = await supabase
    .from("orders")
    .delete()
    .eq("product_id", id)

  if (ordersError) {
    console.error(`[v0] 删除相关订单失败 ${id}:`, ordersError)
    return NextResponse.json({ error: `无法删除相关订单: ${ordersError.message}` }, { status: 500 })
  }

  // 再删除产品
  const { error: productError } = await supabase
    .from("products")
    .delete()
    .eq("id", id)

  if (productError) {
    console.error(`[v0] 删除产品失败 ${id}:`, productError)
    return NextResponse.json({ error: productError.message }, { status: 500 })
  }

  console.log(`[v0] 产品及相关订单删除成功: ${id}`)
  return NextResponse.json({ success: true })
}
