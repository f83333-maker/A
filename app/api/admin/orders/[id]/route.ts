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
