import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

interface ImportedProduct {
  name: string
  price: number
  stock: number
  external_id: string
  external_url: string
}

async function scrapeWebsite(url: string): Promise<ImportedProduct[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    })
    const html = await response.text()

    const products: ImportedProduct[] = []
    // 提取 data-gid, data-name, data-price, data-stock 属性
    const regex = /data-gid="(\d+)"[\s\S]*?data-name="([^"]+)"[\s\S]*?data-price="([^"]+)"[\s\S]*?data-stock="(\d+)"/g

    let match
    const seen = new Set<string>()

    while ((match = regex.exec(html)) !== null) {
      const [, gid, name, price, stock] = match
      if (!seen.has(gid)) {
        seen.add(gid)
        products.push({
          external_id: gid,
          name: name.trim(),
          price: parseFloat(price.replace("¥", "").trim()),
          stock: parseInt(stock),
          external_url: url
        })
      }
    }

    return products
  } catch (error) {
    console.error("[v0] 爬取网站失败:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { success: false, error: "请输入网站URL" },
        { status: 400 }
      )
    }

    console.log("[v0] 开始爬取网站:", url)
    const importedProducts = await scrapeWebsite(url)
    console.log(`[v0] 爬取到 ${importedProducts.length} 个商品`)

    if (importedProducts.length === 0) {
      return NextResponse.json(
        { success: false, error: "未找到商品数据" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 检查外部ID是否已存在
    const existingIds = importedProducts.map(p => p.external_id)
    const { data: existingProducts } = await supabase
      .from("products")
      .select("id, name")
      .in("logo_data", existingIds) // 使用 logo_data 字段存储外部ID

    const existingSet = new Set(existingProducts?.map(p => p.id) || [])
    const newProducts = importedProducts.filter(p => !existingSet.has(p.external_id))

    console.log(`[v0] 新增商品: ${newProducts.length}, 已存在: ${existingProducts?.length || 0}`)

    if (newProducts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "所有商品已存在，无需导入",
        imported: 0
      })
    }

    // 批量插入新商品 (设置为已下架)
    const productsToInsert = newProducts.map(p => ({
      name: p.name,
      price: p.price,
      cost_price: p.price * 0.8, // 自动计算成本价为80%
      stock: p.stock,
      is_active: false, // 下架状态
      delivery_type: "自动发货",
      logo_data: p.external_id, // 存储外部ID
      description: `来自 ${url} 的导入商品`,
      sales: 0,
      sort_order: 999
    }))

    const { data: insertedProducts, error } = await supabase
      .from("products")
      .insert(productsToInsert)
      .select("id")

    if (error) {
      console.error("[v0] 插入商品失败:", error)
      return NextResponse.json(
        { success: false, error: "导入失败: " + error.message },
        { status: 500 }
      )
    }

    console.log(`[v0] 成功导入 ${insertedProducts?.length || 0} 个商品`)

    return NextResponse.json({
      success: true,
      message: `成功导入 ${newProducts.length} 个商品`,
      imported: newProducts.length,
      total: importedProducts.length
    })
  } catch (error) {
    console.error("[v0] 导入API错误:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "导入失败" },
      { status: 500 }
    )
  }
}
