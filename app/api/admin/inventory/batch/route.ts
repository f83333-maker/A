"use server"

import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// 批量同步货源到多个产品
// body: { productIds: string[], content: string }
// 将 content 按行拆分后，每行分发到每个产品
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { productIds, content } = body

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ error: "请选择至少一个产品" }, { status: 400 })
  }
  if (!content || !content.trim()) {
    return NextResponse.json({ error: "货源内容不能为空" }, { status: 400 })
  }

  const lines: string[] = content
    .split("\n")
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0)

  if (lines.length === 0) {
    return NextResponse.json({ error: "没有有效的货源内容" }, { status: 400 })
  }

  let totalAdded = 0
  const results: { productId: string; added: number; error?: string }[] = []

  for (const productId of productIds) {
    const items = lines.map((line: string) => ({
      product_id: productId,
      content: line,
      status: "available"
    }))

    const { data, error } = await supabase
      .from("inventory")
      .insert(items)
      .select()

    if (error) {
      results.push({ productId, added: 0, error: error.message })
      continue
    }

    // 更新该产品的库存数量
    const { count } = await supabase
      .from("inventory")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId)
      .eq("status", "available")

    await supabase
      .from("products")
      .update({ stock: count || 0 })
      .eq("id", productId)

    totalAdded += data.length
    results.push({ productId, added: data.length })
  }

  return NextResponse.json({
    success: true,
    totalAdded,
    linesPerProduct: lines.length,
    productCount: productIds.length,
    results
  })
}
