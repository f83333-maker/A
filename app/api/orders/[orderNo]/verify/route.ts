import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  const { orderNo } = await params
  const body = await request.json()
  const { password } = body

  if (!password) {
    return NextResponse.json({ success: false, error: "请输入密码" }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_no", orderNo)
    .single()

  if (error || !order) {
    return NextResponse.json({ success: false, error: "订单不存在" }, { status: 404 })
  }

  // 计算密码哈希
  const passwordHash = crypto.createHash("sha256").update(password).digest("hex")

  // 验证密码
  if (order.query_password !== passwordHash) {
    return NextResponse.json({ success: false, error: "密码错误" })
  }

  // 获取产品的使用说明
  let usageInstructions = null
  if (order.product_id) {
    const { data: product } = await supabase
      .from("products")
      .select("usage_instructions")
      .eq("id", order.product_id)
      .single()
    usageInstructions = product?.usage_instructions || null
  }

  // 密码正确，返回完整订单信息
  return NextResponse.json({
    success: true,
    order: {
      ...order,
      query_password: "***",
      usage_instructions: usageInstructions,
    }
  })
}
