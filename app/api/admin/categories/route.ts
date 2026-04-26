import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  
  // 获取所有分类
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 获取每个分类的产品数量
  const { data: products } = await supabase
    .from("products")
    .select("category_id")
  
  // 统计每个分类的产品数量
  const productCounts: Record<string, number> = {}
  products?.forEach(p => {
    productCounts[p.category_id] = (productCounts[p.category_id] || 0) + 1
  })

  // 合并产品数量到分类数据
  const categoriesWithCount = categories?.map(cat => ({
    ...cat,
    product_count: productCounts[cat.id] || 0
  }))

  return NextResponse.json(categoriesWithCount)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("categories")
    .insert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
