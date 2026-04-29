import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
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
  const supabase = await createClient()

  console.log(`[v0] 删除产品: ${id}`)

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
