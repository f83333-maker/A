"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

// 获取产品库存列表
export async function GET(request: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get("productId")

  if (!productId) {
    return NextResponse.json({ error: "产品ID不能为空" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 统计库存数量
  const available = data.filter(item => item.status === "available").length
  const sold = data.filter(item => item.status === "sold").length

  return NextResponse.json({ 
    inventory: data,
    stats: { available, sold, total: data.length }
  })
}

// 批量添加库存（一行一个账号）
export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const body = await request.json()
  const { productId, content } = body

  if (!productId || !content) {
    return NextResponse.json({ error: "产品ID和内容不能为空" }, { status: 400 })
  }

  // 按行分割内容，过滤空行
  const lines = content.split("\n").map((line: string) => line.trim()).filter((line: string) => line)

  if (lines.length === 0) {
    return NextResponse.json({ error: "没有有效的库存内容" }, { status: 400 })
  }

  // 批量插入
  const inventoryItems = lines.map((line: string) => ({
    product_id: productId,
    content: line,
    status: "available"
  }))

  const { data, error } = await supabase
    .from("inventory")
    .insert(inventoryItems)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 更新产品库存数量
  const { count } = await supabase
    .from("inventory")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("status", "available")

  await supabase
    .from("products")
    .update({ stock: count || 0 })
    .eq("id", productId)

  return NextResponse.json({ success: true, added: lines.length })
}

// 删除库存
export async function DELETE(request: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const productId = searchParams.get("productId")

  if (!id) {
    return NextResponse.json({ error: "库存ID不能为空" }, { status: 400 })
  }

  const { error } = await supabase
    .from("inventory")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 更新产品库存数量
  if (productId) {
    const { count } = await supabase
      .from("inventory")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId)
      .eq("status", "available")

    await supabase
      .from("products")
      .update({ stock: count || 0 })
      .eq("id", productId)
  }

  return NextResponse.json({ success: true })
}
