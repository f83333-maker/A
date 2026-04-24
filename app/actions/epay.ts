"use server"

import { createEpayOrder } from "@/lib/epay"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function createEpayCheckout(options: {
  productId: string
  quantity: number
  buyerEmail?: string
  buyerName?: string
  paymentType: "wxpay" | "alipay"
  queryPassword?: string
}) {
  const { productId, quantity, buyerEmail, buyerName, paymentType, queryPassword } = options

  try {
    const supabase = await createClient()

    // 获取产品信息
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      throw new Error("产品不存在")
    }

    // 检查库存
    if (product.stock < quantity) {
      throw new Error("库存不足")
    }

    // 生成订单号
    const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    const totalAmount = (product.price * quantity)

    // 创建订单记录（包含查询密码的哈希）
    const passwordHash = queryPassword 
      ? crypto.createHash("sha256").update(queryPassword).digest("hex")
      : null

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_no: orderNo,
        product_id: productId,
        product_name: product.name,
        quantity,
        unit_price: product.price,
        total_amount: totalAmount,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        status: "pending",
        query_password: passwordHash,
      })
      .select()
      .single()

    if (orderError || !order) {
      throw new Error("创建订单失败")
    }

    // 获取回调 URL
    const notifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/epay`

    // 创建易支付支付 URL
    const paymentUrl = await createEpayOrder({
      orderNo,
      amount: totalAmount,
      productId,
      quantity,
      buyerEmail,
      buyerName,
      notifyUrl,
      type: paymentType,
    })

    return {
      success: true,
      url: paymentUrl,
      orderNo,
    }
  } catch (error) {
    console.error("创建易支付订单失败:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "创建订单失败",
    }
  }
}
