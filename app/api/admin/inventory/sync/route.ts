"use server"

import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// 同步所有产品的库存（根据inventory表重新计算）
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    // 获取所有产品
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id")

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ success: true, syncedCount: 0 })
    }

    // 为每个产品计算库存
    let syncedCount = 0
    for (const product of products) {
      // 统计可用库存数量
      const { count: availableCount, error: countError } = await supabase
        .from("inventory")
        .select("*", { count: "exact", head: true })
        .eq("product_id", product.id)
        .eq("status", "available")

      if (countError) {
        console.error(`计算产品 ${product.id} 库存失败:`, countError)
        continue
      }

      // 更新产品的库存数量
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock: availableCount || 0 })
        .eq("id", product.id)

      if (!updateError) {
        syncedCount++
      } else {
        console.error(`更新产品 ${product.id} 库存失败:`, updateError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      syncedCount,
      message: `已成功同步 ${syncedCount} 个产品的库存`
    })
  } catch (error) {
    console.error("库存同步失败:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "库存同步失败" 
    }, { status: 500 })
  }
}
