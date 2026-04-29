import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("orders")
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
  const supabase = await createClient()

  console.log(`[v0] 尝试删除订单: ${id}`)

  // 权限验证：确保只有管理员可以删除订单
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error(`[v0] 未授权的删除请求: 用户未登录`)
    return NextResponse.json(
      { error: "未授权：用户未登录" },
      { status: 401 }
    )
  }

  // 检查用户是否为管理员（这里你需要根据实际情况调整）
  // 可以通过检查用户角色、邮箱、或 user_metadata 中的 is_admin 标记
  const isAdmin = user.user_metadata?.is_admin === true
  if (!isAdmin) {
    console.warn(`[v0] 权限不足: 用户 ${user.id} 尝试删除订单`)
    return NextResponse.json(
      { error: "权限不足：只有管理员才能删除订单" },
      { status: 403 }
    )
  }

  try {
    const { data, error } = await supabase
      .from("orders")
      .delete()
      .eq("id", id)
      .select()

    if (error) {
      console.error(`[v0] 删除订单失败 ${id}:`, error)
      console.error(`[v0] 错误详情:`, {
        code: error.code,
        message: error.message,
        details: error.details,
      })
      return NextResponse.json(
        { error: `删除失败: ${error.message}` },
        { status: 500 }
      )
    }

    console.log(`[v0] 订单删除成功: ${id}`, data)
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error(`[v0] 删除订单异常 ${id}:`, err)
    return NextResponse.json(
      { error: `系统错误: ${err instanceof Error ? err.message : "未知错误"}` },
      { status: 500 }
    )
  }
}
